import { ArrowClockwise, WarningOctagon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface text-center',
        compact ? 'px-5 py-10' : 'px-6 py-16',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-muted hatch">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">{icon}</span>
        </div>
      ) : null}
      <p className="text-[14.5px] font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Could not load this data',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-critical-soft bg-critical-soft px-6 py-12 text-center',
        className,
      )}
    >
      <WarningOctagon size={26} className="text-critical" weight="duotone" aria-hidden />
      <p className="mt-3 text-[14px] font-semibold text-critical">{title}</p>
      <p className="mt-1 max-w-md text-[13px] text-critical/85">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" icon={<ArrowClockwise size={14} />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Full-height boot placeholder shown while the session is being restored. */
export function LoadingScreen({ label = 'Loading console…' }: { label?: string }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-canvas">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-brand-fg">
        <span className="h-4 w-4 animate-pulse rounded-sm bg-brand-fg" />
      </div>
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}
