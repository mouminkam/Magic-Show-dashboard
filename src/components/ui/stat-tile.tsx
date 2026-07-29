import { TrendDown, TrendUp } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Skeleton } from './skeleton';
import { formatSignedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface StatTileProps {
  label: string;
  value: string;
  /** Percentage change vs the previous equivalent period. */
  changePct?: number;
  comparisonLabel?: string;
  icon?: ReactNode;
  loading?: boolean;
  /** Inverts the colour of the trend arrow (e.g. refunds going up is bad). */
  invertTrend?: boolean;
  footer?: ReactNode;
}

export function StatTile({
  label,
  value,
  changePct,
  comparisonLabel = 'vs previous period',
  icon,
  loading = false,
  invertTrend = false,
  footer,
}: StatTileProps) {
  const hasChange = typeof changePct === 'number' && Number.isFinite(changePct);
  const isUp = hasChange && changePct > 0;
  const isFlat = hasChange && changePct === 0;
  const good = invertTrend ? !isUp : isUp;

  return (
    <div className="rounded-lg border border-line bg-surface p-4 card-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-ink tnum">{value}</p>
      )}

      {loading ? (
        <Skeleton className="mt-3 h-3 w-32" />
      ) : hasChange ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px]">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium tnum',
              isFlat
                ? 'bg-sunken text-muted'
                : good
                  ? 'bg-positive-soft text-positive'
                  : 'bg-critical-soft text-critical',
            )}
          >
            {!isFlat ? (
              isUp ? (
                <TrendUp size={12} weight="bold" aria-hidden />
              ) : (
                <TrendDown size={12} weight="bold" aria-hidden />
              )
            ) : null}
            {formatSignedPercent(changePct)}
          </span>
          <span className="text-faint">{comparisonLabel}</span>
        </div>
      ) : footer ? (
        <div className="mt-2.5 text-[12.5px] text-muted">{footer}</div>
      ) : null}
    </div>
  );
}
