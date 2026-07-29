import { cn } from '@/lib/utils';

/**
 * The mark is a stylised "MS" monogram in a rounded tile — a shoe-box shape
 * with a diagonal split, which reads at 20px as well as it does at 44px.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[9px] bg-brand', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 19V5.5L9.4 13 12 9.6 14.6 13 21 5.5V19"
          stroke="var(--c-brand-fg)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  wordmark = true,
  size = 30,
  className,
}: {
  wordmark?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {wordmark ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[14.5px] font-semibold tracking-tight text-ink">Magic Show</span>
          <span className="mt-0.5 truncate text-[10.5px] tracking-[0.08em] text-faint">RETAIL CONSOLE</span>
        </span>
      ) : null}
    </span>
  );
}
