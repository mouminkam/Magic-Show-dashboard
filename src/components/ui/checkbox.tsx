import * as RCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from '@phosphor-icons/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type CheckedState = boolean | 'indeterminate';

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: {
  checked: CheckedState;
  onCheckedChange: (checked: CheckedState) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <RCheckbox.Root
      id={id}
      aria-label={ariaLabel}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-line-strong bg-surface',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'data-[state=checked]:border-brand data-[state=checked]:bg-brand',
        'data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand',
        className,
      )}
    >
      <RCheckbox.Indicator className="text-brand-fg">
        {checked === 'indeterminate' ? (
          <Minus size={11} weight="bold" aria-hidden />
        ) : (
          <Check size={11} weight="bold" aria-hidden />
        )}
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
}

export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <label htmlFor={id} className="cursor-pointer select-none text-[13.5px] text-ink">
        {label}
      </label>
    </div>
  );
}
