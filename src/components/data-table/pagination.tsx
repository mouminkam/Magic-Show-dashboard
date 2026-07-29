import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatNumber } from '@/lib/format';

const PAGE_SIZES = ['10', '25', '50', '100'];

export function TablePagination({
  page,
  perPage,
  total,
  totalPages,
  onPageChange,
  onPerPageChange,
  disabled = false,
}: {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  disabled?: boolean;
}) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-[12.5px] text-muted tnum">
        {total === 0 ? 'No results' : `${formatNumber(first)}–${formatNumber(last)} of ${formatNumber(total)}`}
      </p>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-[12.5px] text-faint">Rows</span>
          <Select
            size="sm"
            className="w-[4.75rem]"
            aria-label="Rows per page"
            value={String(perPage)}
            onValueChange={(value) => onPerPageChange(Number(value))}
            options={PAGE_SIZES.map((size) => ({ value: size, label: size }))}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <CaretLeft size={14} aria-hidden />
          </Button>
          <span className="min-w-[5.5rem] text-center text-[12.5px] text-muted tnum">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <CaretRight size={14} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
