import * as RTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabDef {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  value,
  onValueChange,
  tabs,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabDef[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List className="flex items-center gap-0.5 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <RTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2.5',
              'text-[13.5px] font-medium text-muted transition-colors',
              'hover:text-ink data-[state=active]:border-brand data-[state=active]:text-ink',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10.5px] tabular-nums text-muted">
                {tab.count}
              </span>
            ) : null}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  );
}

export const TabPanel = RTabs.Content;
