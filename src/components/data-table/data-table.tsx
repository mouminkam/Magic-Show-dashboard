import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowsDownUp, Columns, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/field';
import { Menu, MenuCheckboxItem, MenuContent, MenuLabel, MenuTrigger } from '@/components/ui/menu';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TablePagination } from './pagination';
import { errorMessage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/types/api';
import './types';

export interface DataTableProps<T extends { id: number }> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** Page envelope from the service. */
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;

  sortBy?: string;
  sortDir: SortDirection;
  onSortChange: (column: string) => void;

  loading?: boolean;
  /** True for background refetches — dims the body instead of showing skeletons. */
  fetching?: boolean;
  error?: unknown;
  onRetry?: () => void;

  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Filter controls rendered in the toolbar. */
  filters?: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;

  /** Actions rendered when at least one row is selected. */
  selectionActions?: (selectedIds: number[], clear: () => void) => ReactNode;

  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;
  /** Stable id for persisting nothing — used only for aria labelling. */
  label: string;
}

/**
 * The console's single table implementation.
 *
 * Sorting and pagination are *manual* — the service does the work and this
 * component only reflects the state, which is what makes every list screen
 * behave identically against a real paginated API.
 */
export function DataTable<T extends { id: number }>({
  columns,
  data,
  total,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
  sortBy,
  sortDir,
  onSortChange,
  loading = false,
  fetching = false,
  error,
  onRetry,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  activeFilterCount = 0,
  onClearFilters,
  selectionActions,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  emptyIcon,
  label,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const selectable = Boolean(selectionActions);

  const tableColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!selectable) return columns;
    const selectColumn: ColumnDef<T, unknown> = {
      id: '__select',
      meta: { locked: true, cellClassName: 'w-10' },
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
        />
      ),
      cell: ({ row }) => (
        <span onClick={(event) => event.stopPropagation()} className="flex">
          <Checkbox
            aria-label={`Select row ${row.index + 1}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
        </span>
      ),
      enableSorting: false,
    };
    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: selectable,
    getRowId: (row) => String(row.id),
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
  });

  // A page or filter change invalidates the selection — never act on stale ids.
  useEffect(() => {
    setRowSelection({});
  }, [page, perPage, search]);

  const selectedIds = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map(Number);
  const clearSelection = () => setRowSelection({});

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => !column.columnDef.meta?.locked && column.getCanHide());

  const alignClass = (align?: 'start' | 'end' | 'center') =>
    align === 'end' ? 'text-end' : align === 'center' ? 'text-center' : 'text-start';

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface card-shadow">
      {/* ------------------------------------------------------------ toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="relative min-w-[13rem] flex-1">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={`Search ${label}`}
            className="h-8 ps-8 pe-8"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
            >
              <X size={13} aria-hidden />
            </button>
          ) : null}
        </div>

        {filters}

        {activeFilterCount > 0 && onClearFilters ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear ({activeFilterCount})
          </Button>
        ) : null}

        {hideableColumns.length > 0 ? (
          <Menu>
            <MenuTrigger asChild>
              <Button variant="outline" size="sm" icon={<Columns size={14} />}>
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Visible columns</MenuLabel>
              {hideableColumns.map((column) => (
                <MenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(value)}
                >
                  {column.columnDef.meta?.title ?? column.id}
                </MenuCheckboxItem>
              ))}
            </MenuContent>
          </Menu>
        ) : null}
      </div>

      {/* ---------------------------------------------------- selection strip */}
      {selectable && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-brand-soft bg-brand-soft px-4 py-2">
          <p className="text-[12.5px] font-medium text-brand tnum">
            {selectedIds.length} selected
          </p>
          <div className="ms-auto flex items-center gap-2">
            {selectionActions?.(selectedIds, clearSelection)}
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {/* --------------------------------------------------------------- body */}
      {error ? (
        <div className="p-4">
          <ErrorState message={errorMessage(error)} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="p-3">
          <TableSkeleton cols={Math.min(tableColumns.length, 6)} />
        </div>
      ) : data.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
            compact
          />
        </div>
      ) : (
        <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')}>
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="sr-only">{label}</caption>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-line bg-sunken/50">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta;
                    const sortKey = meta?.sortKey;
                    const isSorted = sortKey !== undefined && sortBy === sortKey;
                    const content = header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext());

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className={cn(
                          'whitespace-nowrap px-4 py-2.5 font-medium',
                          'text-[11px] uppercase tracking-[0.06em] text-faint',
                          alignClass(meta?.align),
                          meta?.cellClassName,
                        )}
                      >
                        {sortKey ? (
                          <button
                            type="button"
                            onClick={() => onSortChange(sortKey)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded transition-colors hover:text-ink',
                              isSorted && 'text-ink',
                              meta?.align === 'end' && 'flex-row-reverse',
                            )}
                          >
                            {content}
                            {isSorted ? (
                              sortDir === 'asc' ? (
                                <ArrowUp size={11} weight="bold" aria-hidden />
                              ) : (
                                <ArrowDown size={11} weight="bold" aria-hidden />
                              )
                            ) : (
                              <ArrowsDownUp size={11} className="opacity-35" aria-hidden />
                            )}
                          </button>
                        ) : (
                          content
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-line">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={row.getIsSelected() || undefined}
                  className={cn(
                    'transition-colors',
                    row.getIsSelected() ? 'bg-brand-soft/50' : 'hover:bg-sunken/70',
                    onRowClick && 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-2.5 align-middle text-ink',
                          alignClass(meta?.align),
                          meta?.cellClassName,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && !loading && data.length > 0 ? (
        <TablePagination
          page={page}
          perPage={perPage}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          disabled={fetching}
        />
      ) : null}
    </div>
  );
}
