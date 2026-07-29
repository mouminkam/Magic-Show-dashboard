import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Receipt, ShoppingBag } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MoneyCell, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { ordersService } from '@/services/orders';
import { qk } from '@/lib/query-keys';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from '@/lib/status';
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderListItem } from '@/types/domain';

export default function OrderListPage() {
  const navigate = useNavigate();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });

  const query = useQuery({
    queryKey: qk.orderList(controls.params),
    queryFn: () => ordersService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<OrderListItem, unknown>[]>(
    () => [
      {
        id: 'order_number',
        header: 'Order',
        meta: { sortKey: 'order_number', title: 'Order' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.order_number}
            subtitle={`${row.original.item_count} item${row.original.item_count === 1 ? '' : 's'} · ${
              PAYMENT_METHOD_LABEL[row.original.payment_method] ?? row.original.payment_method
            }`}
          />
        ),
      },
      {
        id: 'customer_name',
        header: 'Customer',
        meta: { sortKey: 'customer_name', title: 'Customer' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.customer_name}</p>
            <p className="truncate text-[12px] text-muted">{row.original.customer_email}</p>
          </div>
        ),
      },
      {
        id: 'created_at',
        header: 'Placed',
        meta: { sortKey: 'created_at', title: 'Placed' },
        cell: ({ row }) => <MutedCell>{formatDateTime(row.original.created_at)}</MutedCell>,
      },
      {
        id: 'status',
        header: 'Status',
        meta: { sortKey: 'status', title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={ORDER_STATUS_TONE[row.original.status]} dot>
            {ORDER_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'payment_status',
        header: 'Payment',
        meta: { title: 'Payment' },
        cell: ({ row }) => (
          <Badge tone={PAYMENT_STATUS_TONE[row.original.payment_status]}>
            {PAYMENT_STATUS_LABEL[row.original.payment_status]}
          </Badge>
        ),
      },
      {
        id: 'total_amount',
        header: 'Total',
        meta: { sortKey: 'total_amount', align: 'end', title: 'Total' },
        cell: ({ row }) => <MoneyCell>{formatMoney(row.original.total_amount)}</MoneyCell>,
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<Eye size={15} />} onSelect={() => navigate(`/orders/${row.original.id}`)}>
              View order
            </MenuItem>
            <MenuItem
              icon={<Receipt size={15} />}
              onSelect={() => navigate(`/orders/${row.original.id}/invoice`)}
            >
              Open invoice
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Orders"
        description="Every basket placed through the storefront and the branch tills. Click a row for line items and fulfilment."
      />

      <DataTable
        label="Orders"
        columns={columns}
        data={query.data?.rows ?? []}
        total={query.data?.total ?? 0}
        page={query.data?.page ?? controls.page}
        perPage={controls.perPage}
        totalPages={query.data?.totalPages ?? 1}
        onPageChange={controls.setPage}
        onPerPageChange={controls.setPerPage}
        sortBy={controls.sortBy}
        sortDir={controls.sortDir}
        onSortChange={controls.toggleSort}
        loading={query.isLoading}
        fetching={query.isFetching && !query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by order number, customer, tracking or product…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyIcon={<ShoppingBag size={18} />}
        emptyTitle="No orders match"
        emptyDescription="Try a different status or widen the date range."
        filters={
          <>
            <FilterSelect
              label="Status"
              value={controls.filters.status ?? 'all'}
              onChange={(value) => controls.setFilter('status', value)}
              options={[
                { value: 'all', label: 'All statuses' },
                ...ORDER_STATUSES.map((status) => ({
                  value: status,
                  label: ORDER_STATUS_LABEL[status],
                })),
              ]}
            />
            <FilterSelect
              label="Payment"
              value={controls.filters.payment_status ?? 'all'}
              onChange={(value) => controls.setFilter('payment_status', value)}
              options={[
                { value: 'all', label: 'Any payment' },
                ...PAYMENT_STATUSES.map((status) => ({
                  value: status,
                  label: PAYMENT_STATUS_LABEL[status],
                })),
              ]}
            />
            <FilterSelect
              label="Date range"
              value={controls.filters.range ?? 'all'}
              onChange={(value) => controls.setFilter('range', value)}
              options={[
                { value: 'all', label: 'All time' },
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
              ]}
            />
          </>
        }
      />
    </div>
  );
}
