import { DotsThree } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Menu, MenuContent, MenuTrigger } from '@/components/ui/menu';
import { Select, type SelectOption } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Name + secondary line, optionally with a thumbnail. Used as column one. */
export function PrimaryCell({
  title,
  subtitle,
  image,
  imageRounded = 'md',
  badge,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  image?: string | null;
  imageRounded?: 'md' | 'full';
  badge?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {image !== undefined ? (
        <Avatar src={image} name={typeof title === 'string' ? title : ''} size={34} rounded={imageRounded} />
      ) : null}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-ink">{title}</span>
          {badge}
        </div>
        {subtitle ? <p className="truncate text-[12px] text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/** Right-aligned monospace-ish figure. */
export function MoneyCell({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <span className={cn('tnum', muted ? 'text-muted' : 'font-medium text-ink')}>{children}</span>;
}

export function MutedCell({ children }: { children: ReactNode }) {
  return <span className="text-muted">{children}</span>;
}

/** Overflow menu anchored to the end of a row. */
export function RowActions({ children, label = 'Row actions' }: { children: ReactNode; label?: string }) {
  return (
    <span onClick={(event) => event.stopPropagation()} className="flex justify-end">
      <Menu>
        <MenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <DotsThree size={18} weight="bold" aria-hidden />
          </Button>
        </MenuTrigger>
        <MenuContent>{children}</MenuContent>
      </Menu>
    </span>
  );
}

/** Compact labelled select for the DataTable toolbar. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  return (
    <Select
      size="sm"
      aria-label={label}
      value={value}
      onValueChange={onChange}
      options={options}
      className={cn('w-auto min-w-[8.5rem]', className)}
    />
  );
}

export const YES_NO_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Any status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
