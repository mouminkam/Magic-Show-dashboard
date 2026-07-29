import * as RAvatar from '@radix-ui/react-avatar';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Avatar({
  src,
  name,
  size = 32,
  className,
  rounded = 'full',
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  rounded?: 'full' | 'md';
}) {
  return (
    <RAvatar.Root
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-sunken ring-1 ring-inset ring-line',
        rounded === 'full' ? 'rounded-full' : 'rounded-md',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? <RAvatar.Image src={src} alt="" className="h-full w-full object-cover" /> : null}
      <RAvatar.Fallback
        delayMs={src ? 300 : 0}
        className="flex h-full w-full items-center justify-center font-medium text-muted"
        style={{ fontSize: Math.max(10, size * 0.36) }}
      >
        {initials(name)}
      </RAvatar.Fallback>
    </RAvatar.Root>
  );
}
