import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'brand' | 'positive' | 'caution' | 'critical' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted ring-line',
  brand: 'bg-brand-soft text-brand ring-brand-soft',
  positive: 'bg-positive-soft text-positive ring-positive-soft',
  caution: 'bg-caution-soft text-caution ring-caution-soft',
  critical: 'bg-critical-soft text-critical ring-critical-soft',
  info: 'bg-accent-info-soft text-accent-info ring-accent-info-soft',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Adds the leading status dot used on order/stock states. */
  dot?: boolean;
}

export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-5',
        'whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
