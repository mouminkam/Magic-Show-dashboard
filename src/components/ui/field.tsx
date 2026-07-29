import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-md border border-line bg-surface text-ink placeholder:text-faint ' +
  'transition-[border-color,box-shadow] duration-150 ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring ' +
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-faint ' +
  'aria-[invalid=true]:border-critical aria-[invalid=true]:focus:ring-critical-soft';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, 'h-9 px-2.5 text-[13.5px]', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(CONTROL, 'min-h-[92px] resize-y px-2.5 py-2 text-[13.5px] leading-relaxed', className)}
        {...props}
      />
    );
  },
);

export interface FieldProps {
  label: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

/**
 * Label + control + message, wired for accessibility.
 *
 * The control is a render prop so the ids, `aria-invalid` and `aria-describedby`
 * are always attached to the real input rather than guessed at by the caller.
 */
export function Field({ label, children, error, hint, required, className }: FieldProps) {
  const id = useId();
  const messageId = error || hint ? `${id}-message` : undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-medium text-ink">
        {label}
        {required ? (
          <span className="ms-0.5 text-critical" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': messageId })}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 flex items-center gap-1 text-[12px] text-critical">
          <WarningCircle size={13} weight="fill" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[12px] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Two-column responsive grid for dialog and page forms. */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

/** Full-width cell inside a FieldGrid. */
export function FieldSpan({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sm:col-span-2', className)}>{children}</div>;
}
