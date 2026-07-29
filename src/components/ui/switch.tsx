import * as RSwitch from '@radix-ui/react-switch';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}) {
  return (
    <RSwitch.Root
      id={id}
      aria-label={ariaLabel}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'data-[state=checked]:bg-brand data-[state=unchecked]:bg-line-strong',
      )}
    >
      <RSwitch.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm',
          'transition-transform duration-150 will-change-transform',
          'data-[state=checked]:translate-x-[1.125rem]',
        )}
      />
    </RSwitch.Root>
  );
}

/** Switch with a label and optional description, used all over the settings. */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line bg-surface px-3.5 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[13.5px] font-medium text-ink">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{description}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
