import * as RDialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  /** When set, the body is wrapped in a <form> and footer buttons submit it. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Radix dialog with the console's chrome. Focus trapping, escape handling and
 * scroll locking come from the primitive; the long-form bodies scroll inside
 * the panel so the header and footer stay pinned.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  onSubmit,
}: DialogProps) {
  const body = (
    <>
      <div className="max-h-[min(70vh,44rem)] overflow-y-auto px-5 py-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-2 border-t border-line bg-sunken/60 px-5 py-3.5">
          {footer}
        </div>
      ) : null}
    </>
  );

  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in-up" />
        <RDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'overflow-hidden rounded-xl border border-line bg-overlay shadow-[var(--shadow-lg)]',
            'data-[state=open]:animate-in-up',
            WIDTHS[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <RDialog.Title className="text-[15px] font-semibold text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-[13px] text-muted">
                  {description}
                </RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{title}</RDialog.Description>
              )}
            </div>
            <RDialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close dialog">
                <X size={16} aria-hidden />
              </Button>
            </RDialog.Close>
          </div>

          {onSubmit ? <form onSubmit={onSubmit} noValidate>{body}</form> : body}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const DialogClose = RDialog.Close;
