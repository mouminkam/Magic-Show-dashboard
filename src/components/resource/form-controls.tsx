import { Controller, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Select, type SelectOption } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/** Read a possibly-nested error message off the form state. */
function errorAt<T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>): string | undefined {
  const segments = String(name).split('.');
  let cursor: unknown = form.formState.errors;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor && typeof cursor === 'object' && 'message' in cursor) {
    const message = (cursor as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

interface BaseProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  className,
  disabled,
  placeholder,
  type = 'text',
}: BaseProps<T> & { placeholder?: string; type?: 'text' | 'email' | 'url' | 'date' | 'time' | 'password' }) {
  const error = errorAt(form, name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => (
        <Input {...props} {...form.register(name)} type={type} placeholder={placeholder} disabled={disabled} />
      )}
    </Field>
  );
}

export function NumberField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  className,
  disabled,
  placeholder,
  step = 'any',
  min,
  max,
  prefix,
}: BaseProps<T> & {
  placeholder?: string;
  step?: string | number;
  min?: number;
  max?: number;
  /** Static adornment such as a currency code. */
  prefix?: string;
}) {
  const error = errorAt(form, name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => (
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-[12.5px] text-faint">
              {prefix}
            </span>
          ) : null}
          <Input
            {...props}
            {...form.register(name)}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(prefix && 'ps-11')}
          />
        </div>
      )}
    </Field>
  );
}

export function TextareaField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  className,
  disabled,
  placeholder,
  rows,
}: BaseProps<T> & { placeholder?: string; rows?: number }) {
  const error = errorAt(form, name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => (
        <Textarea {...props} {...form.register(name)} rows={rows} placeholder={placeholder} disabled={disabled} />
      )}
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  className,
  disabled,
  options,
  placeholder,
}: BaseProps<T> & { options: SelectOption[]; placeholder?: string }) {
  const error = errorAt(form, name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select
              {...props}
              disabled={disabled}
              placeholder={placeholder}
              value={field.value === null || field.value === undefined ? '' : String(field.value)}
              onValueChange={field.onChange}
              options={options}
            />
          )}
        />
      )}
    </Field>
  );
}

export function SwitchField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  disabled,
  className,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div
          className={cn(
            'flex items-start justify-between gap-4 rounded-md border border-line bg-surface px-3 py-2.5',
            className,
          )}
        >
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">{label}</p>
            {description ? (
              <p className="mt-0.5 text-[12px] leading-snug text-muted">{description}</p>
            ) : null}
          </div>
          <Switch
            aria-label={label}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </div>
      )}
    />
  );
}

/** Colour picker + hex text input kept in sync. */
export function ColorField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  hint,
  className,
}: BaseProps<T>) {
  const error = errorAt(form, name);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(props) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : '#000000';
            const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
            return (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${label} swatch`}
                  value={isValidHex ? value : '#000000'}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-1"
                />
                <Input
                  {...props}
                  value={value}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  placeholder="#1a1a1a"
                  className="font-mono"
                />
              </div>
            );
          }}
        />
      )}
    </Field>
  );
}

/** Grouped block heading inside a long form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-0.5 mb-3 text-[12.5px] text-muted">{description}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}
