import { cn } from '@/lib/utils';

/** Intrinsic aspect ratio of /public/logo.png (1336 x 840). */
const LOGO_ASPECT = 1336 / 840;

/**
 * The real Magic Show brand mark — shared asset with the storefront, so the
 * console and the shop read as one product. Rendered at its native aspect
 * ratio rather than forced into a square tile.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  const height = size;
  const width = Math.round(size * LOGO_ASPECT);
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)} style={{ height }}>
      <img
        src="/logo.png"
        alt="Magic Show"
        width={width}
        height={height}
        style={{ height: '100%', width: 'auto' }}
      />
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
