import * as RSelect from '@radix-ui/react-select';
import { CaretDown, CaretUp, Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional right-aligned hint, e.g. a count. */
  meta?: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  size = 'md',
  className,
  disabled,
  id,
  ...aria
}: SelectProps) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RSelect.Trigger
        id={id}
        {...aria}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface text-ink',
          'transition-[border-color,box-shadow] duration-150',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring',
          'data-[placeholder]:text-faint disabled:cursor-not-allowed disabled:bg-sunken disabled:text-faint',
          'aria-[invalid=true]:border-critical',
          size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-2.5 text-[13.5px]',
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <CaretDown size={13} className="text-faint" aria-hidden />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)]',
            'overflow-hidden rounded-md border border-line bg-overlay shadow-[var(--shadow-lg)]',
            'data-[state=open]:animate-in-up',
          )}
        >
          <RSelect.ScrollUpButton className="flex h-6 items-center justify-center text-faint">
            <CaretUp size={12} />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="p-1">
            {options.map((option) => (
              <RSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pe-8 ps-2.5',
                  'text-[13.5px] text-muted outline-none',
                  'data-[highlighted]:bg-sunken data-[highlighted]:text-ink',
                  'data-[state=checked]:font-medium data-[state=checked]:text-ink',
                )}
              >
                <RSelect.ItemText>{option.label}</RSelect.ItemText>
                {option.meta ? <span className="ms-auto text-[11.5px] text-faint">{option.meta}</span> : null}
                <RSelect.ItemIndicator className="absolute end-2.5 inline-flex items-center">
                  <Check size={13} weight="bold" className="text-brand" aria-hidden />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="flex h-6 items-center justify-center text-faint">
            <CaretDown size={12} />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
