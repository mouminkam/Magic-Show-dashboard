import * as RMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Menu = RMenu.Root;
export const MenuTrigger = RMenu.Trigger;

export function MenuContent({
  children,
  align = 'end',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-[11rem] overflow-hidden rounded-md border border-line bg-overlay p-1',
          'shadow-[var(--shadow-lg)] data-[state=open]:animate-in-up',
          className,
        )}
      >
        {children}
      </RMenu.Content>
    </RMenu.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  icon,
  destructive = false,
  disabled = false,
}: {
  children: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <RMenu.Item
      disabled={disabled}
      onSelect={(event) => {
        // Keep the trigger's row-click handler from firing behind the menu.
        event.preventDefault();
        onSelect?.();
      }}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13.5px] outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        destructive
          ? 'text-critical data-[highlighted]:bg-critical-soft'
          : 'text-muted data-[highlighted]:bg-sunken data-[highlighted]:text-ink',
      )}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </RMenu.Item>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <RMenu.Label className="px-2.5 py-1.5 eyebrow">{children}</RMenu.Label>;
}

export function MenuSeparator() {
  return <RMenu.Separator className="my-1 h-px bg-line" />;
}

export function MenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
}: {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <RMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(event) => event.preventDefault()}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pe-2.5 ps-7 text-[13.5px]',
        'relative text-muted outline-none data-[highlighted]:bg-sunken data-[highlighted]:text-ink',
      )}
    >
      <RMenu.ItemIndicator className="absolute start-2 inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
      </RMenu.ItemIndicator>
      {children}
    </RMenu.CheckboxItem>
  );
}
