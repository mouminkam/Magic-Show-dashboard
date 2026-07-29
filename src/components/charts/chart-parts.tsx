import type { ReactNode } from 'react';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

/**
 * Shared Recharts styling. Colours come from CSS custom properties so a theme
 * switch repaints the charts without React re-rendering them with new props.
 */
export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const;

export const axisProps = {
  stroke: 'var(--chart-axis)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: 'var(--chart-grid)',
  strokeDasharray: '3 3',
  vertical: false,
} as const;

export interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  /** Formats the value shown against each series. */
  format?: (value: number) => string;
  /** Overrides the heading, which defaults to the category label. */
  labelFormat?: (label: string) => string;
}

export function ChartTooltip({ active, payload, label, format, labelFormat }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const heading = typeof label === 'string' ? (labelFormat ? labelFormat(label) : label) : '';

  return (
    <div className="rounded-md border border-line bg-overlay px-2.5 py-2 shadow-[var(--shadow-md)]">
      {heading ? <p className="mb-1 text-[11.5px] font-medium text-muted">{heading}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry, index) => {
          const numeric = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
          return (
            <li key={`${entry.name}-${index}`} className="flex items-center gap-2 text-[12.5px]">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: entry.color }}
                aria-hidden
              />
              <span className="text-muted">{entry.name}</span>
              <span className="ms-auto font-medium text-ink tnum">
                {format ? format(numeric) : numeric.toLocaleString('en-US')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Legend rendered outside the SVG so it inherits page typography. */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; value?: ReactNode }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[12.5px]">
          <span
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ background: item.color }}
            aria-hidden
          />
          <span className="text-muted">{item.label}</span>
          {item.value !== undefined ? (
            <span className="font-medium text-ink tnum">{item.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
