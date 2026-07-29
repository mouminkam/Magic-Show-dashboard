import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowsDownUp,
  ClockCounterClockwise,
  Minus,
  Plus,
  Warehouse as WarehouseIcon,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { MenuItem } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { NumberField, SelectField, TextareaField } from '@/components/resource/form-controls';
import { useListControls } from '@/hooks/use-list-controls';
import { branchHooks, warehouseHooks } from '@/hooks/resources';
import { inventoryService } from '@/services/inventory';
import { useAuth } from '@/auth/auth-context';
import { qk } from '@/lib/query-keys';
import { stockAdjustmentSchema, type StockAdjustmentValues } from '@/lib/schemas';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { STOCK_STATUS_LABEL, STOCK_STATUS_TONE } from '@/lib/status';
import { cn, errorMessage } from '@/lib/utils';
import type { InventoryListItem, StockMovement } from '@/types/domain';

const REASON_OPTIONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'sale', label: 'Sale' },
  { value: 'damage', label: 'Damage / write-off' },
  { value: 'correction', label: 'Stock count correction' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'return', label: 'Customer return' },
];

const ADJUST_DEFAULTS: StockAdjustmentValues = { delta: 1, reason: 'restock', note: '' };

function LocationSummary() {
  const summaryQuery = useQuery({
    queryKey: qk.inventorySummary(),
    queryFn: () => inventoryService.summary(),
  });

  if (summaryQuery.isLoading) {
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[6.5rem]" />
        ))}
      </div>
    );
  }

  const rows = summaryQuery.data ?? [];
  const totalUnits = rows.reduce((sum, row) => sum + row.units, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const totalLow = rows.reduce((sum, row) => sum + row.lowStock, 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Units on hand" value={formatNumber(totalUnits)} icon={<WarehouseIcon size={14} />} />
        <StatTile label="Stock value (cost)" value={formatMoney(totalValue)} />
        <StatTile label="Rows below reorder" value={formatNumber(totalLow)} />
        <StatTile label="Stock locations" value={formatNumber(rows.length)} />
      </div>

      <Card className="mb-4">
        <CardHeader title="By location" description="Available units and cost value held at each site." />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const share = totalUnits > 0 ? (row.units / totalUnits) * 100 : 0;
              return (
                <div key={row.key} className="rounded-md border border-line bg-sunken/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-[13px] font-medium text-ink">{row.name}</p>
                    <Badge tone={row.type === 'warehouse' ? 'info' : 'neutral'}>{row.type}</Badge>
                  </div>
                  <p className="mt-1.5 text-[19px] font-semibold text-ink tnum">
                    {formatNumber(row.units)}
                    <span className="ms-1 text-[12px] font-normal text-faint">units</span>
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span className="text-muted tnum">{formatMoney(row.value)}</span>
                    {row.lowStock > 0 ? (
                      <span className="text-caution tnum">{row.lowStock} low</span>
                    ) : (
                      <span className="text-positive">Healthy</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function MovementLog() {
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });
  const query = useQuery({
    queryKey: qk.stockMovements(controls.params),
    queryFn: () => inventoryService.movements(controls.params),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<StockMovement, unknown>[]>(
    () => [
      {
        id: 'product_name',
        header: 'Product',
        meta: { sortKey: 'product_name', title: 'Product' },
        cell: ({ row }) => (
          <PrimaryCell title={row.original.product_name} subtitle={row.original.location_name} />
        ),
      },
      {
        id: 'delta',
        header: 'Change',
        meta: { sortKey: 'delta', align: 'end', title: 'Change' },
        cell: ({ row }) => (
          <span
            className={cn(
              'tnum font-medium',
              row.original.delta > 0 ? 'text-positive' : 'text-critical',
            )}
          >
            {row.original.delta > 0 ? '+' : ''}
            {row.original.delta}
          </span>
        ),
      },
      {
        id: 'resulting_quantity',
        header: 'Resulting',
        meta: { align: 'end', title: 'Resulting' },
        cell: ({ row }) => <MutedCell>{row.original.resulting_quantity}</MutedCell>,
      },
      {
        id: 'reason',
        header: 'Reason',
        meta: { title: 'Reason' },
        cell: ({ row }) => <Badge tone="neutral">{row.original.reason}</Badge>,
      },
      {
        id: 'note',
        header: 'Note',
        meta: { title: 'Note', cellClassName: 'max-w-[18rem]' },
        cell: ({ row }) => (
          <MutedCell>
            <span className="line-clamp-1">{row.original.note || '—'}</span>
          </MutedCell>
        ),
      },
      {
        id: 'actor',
        header: 'By',
        meta: { title: 'By' },
        cell: ({ row }) => <MutedCell>{row.original.actor}</MutedCell>,
      },
      {
        id: 'created_at',
        header: 'When',
        meta: { sortKey: 'created_at', title: 'When' },
        cell: ({ row }) => <MutedCell>{formatDateTime(row.original.created_at)}</MutedCell>,
      },
    ],
    [],
  );

  const rows = query.data?.rows ?? [];

  return (
    <DataTable
      label="Stock movements"
      columns={columns}
      data={rows}
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
      searchPlaceholder="Search movements by product, location or operator…"
      activeFilterCount={controls.activeFilterCount}
      onClearFilters={controls.resetFilters}
      emptyIcon={<ClockCounterClockwise size={18} />}
      emptyTitle="No movements recorded"
      emptyDescription="Stock adjustments made in this session will appear here."
      filters={
        <>
          <FilterSelect
            label="Reason"
            value={controls.filters.reason ?? 'all'}
            onChange={(value) => controls.setFilter('reason', value)}
            options={[{ value: 'all', label: 'All reasons' }, ...REASON_OPTIONS]}
          />
          <FilterSelect
            label="Direction"
            value={controls.filters.direction ?? 'all'}
            onChange={(value) => controls.setFilter('direction', value)}
            options={[
              { value: 'all', label: 'In & out' },
              { value: 'in', label: 'Stock in' },
              { value: 'out', label: 'Stock out' },
            ]}
          />
        </>
      }
    />
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState('levels');
  const [adjusting, setAdjusting] = useState<InventoryListItem | null>(null);

  const controls = useListControls({
    perPage: 10,
    sortBy: 'available_quantity',
    sortDir: 'asc',
  });
  const lowStockControls = useListControls({
    perPage: 10,
    sortBy: 'available_quantity',
    sortDir: 'asc',
    filters: { stock_status: 'low_stock' },
  });

  const query = useQuery({
    queryKey: qk.list('inventory', controls.params),
    queryFn: () => inventoryService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const lowStockQuery = useQuery({
    queryKey: qk.list('inventory-low', lowStockControls.params),
    queryFn: () =>
      inventoryService.list({
        ...lowStockControls.params,
        filters: { ...lowStockControls.params.filters },
      }),
    placeholderData: (previous) => previous,
  });

  const warehousesQuery = warehouseHooks.useAll();
  const branchesQuery = branchHooks.useAll();

  const form = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: ADJUST_DEFAULTS,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: StockAdjustmentValues }) =>
      inventoryService.adjust(id, values, user?.name ?? 'Console operator'),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: qk.resource('inventory') });
      void queryClient.invalidateQueries({ queryKey: qk.list('inventory-low', {}) });
      void queryClient.invalidateQueries({ queryKey: qk.resource('products') });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAdjusting(null);
      toast.success('Stock adjusted', {
        description: `${row.product_name} at ${row.location_name} is now ${row.quantity} units.`,
      });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not adjust that stock row')),
  });

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All locations' },
      ...(warehousesQuery.data ?? []).map((warehouse) => ({
        value: `warehouse:${warehouse.id}`,
        label: warehouse.name,
      })),
      ...(branchesQuery.data ?? []).map((branch) => ({
        value: `branch:${branch.id}`,
        label: branch.name,
      })),
    ],
    [warehousesQuery.data, branchesQuery.data],
  );

  const buildColumns = (): ColumnDef<InventoryListItem, unknown>[] => [
    {
      id: 'product_name',
      header: 'Product',
      meta: { sortKey: 'product_name', title: 'Product' },
      cell: ({ row }) => (
        <PrimaryCell title={row.original.product_name} subtitle={row.original.product_sku} />
      ),
    },
    {
      id: 'location_name',
      header: 'Location',
      meta: { sortKey: 'location_name', title: 'Location' },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-ink">{row.original.location_name}</p>
          <p className="truncate text-[12px] text-muted">
            Rack {row.original.rack_location} · Shelf {row.original.shelf_location}
          </p>
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'On hand',
      meta: { sortKey: 'quantity', align: 'end', title: 'On hand' },
      cell: ({ row }) => <span className="tnum text-ink">{row.original.quantity}</span>,
    },
    {
      id: 'reserved_quantity',
      header: 'Reserved',
      meta: { sortKey: 'reserved_quantity', align: 'end', title: 'Reserved' },
      cell: ({ row }) => <MutedCell>{row.original.reserved_quantity}</MutedCell>,
    },
    {
      id: 'available_quantity',
      header: 'Available',
      meta: { sortKey: 'available_quantity', align: 'end', title: 'Available' },
      cell: ({ row }) => (
        <span className="tnum font-medium text-ink">{row.original.available_quantity}</span>
      ),
    },
    {
      id: 'min_quantity',
      header: 'Reorder at',
      meta: { sortKey: 'min_quantity', align: 'end', title: 'Reorder at' },
      cell: ({ row }) => <MutedCell>{row.original.min_quantity}</MutedCell>,
    },
    {
      id: 'stock_status',
      header: 'Status',
      meta: { title: 'Status' },
      cell: ({ row }) => (
        <Badge tone={STOCK_STATUS_TONE[row.original.stock_status]} dot>
          {STOCK_STATUS_LABEL[row.original.stock_status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      meta: { locked: true, align: 'end', cellClassName: 'w-14' },
      cell: ({ row }) => (
        <RowActions>
          <MenuItem
            icon={<Plus size={15} />}
            onSelect={() => {
              form.reset({ delta: 10, reason: 'restock', note: '' });
              setAdjusting(row.original);
            }}
          >
            Receive stock
          </MenuItem>
          <MenuItem
            icon={<Minus size={15} />}
            onSelect={() => {
              form.reset({ delta: -1, reason: 'damage', note: '' });
              setAdjusting(row.original);
            }}
          >
            Write off
          </MenuItem>
          <MenuItem
            icon={<ArrowsDownUp size={15} />}
            onSelect={() => {
              form.reset({ delta: 0, reason: 'correction', note: '' });
              setAdjusting(row.original);
            }}
          >
            Correct count
          </MenuItem>
        </RowActions>
      ),
    },
  ];

  const levelsColumns = buildColumns();

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Inventory"
        description="Stock held across the distribution centres and retail branches, with a full adjustment log."
      />

      <LocationSummary />

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'levels', label: 'Stock levels', count: query.data?.total },
          { value: 'low', label: 'Low & out of stock', count: lowStockQuery.data?.total },
          { value: 'movements', label: 'Movement log' },
        ]}
      >
        <TabPanel value="levels" className="pt-4">
          <DataTable
            label="Stock levels"
            columns={levelsColumns}
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
            searchPlaceholder="Search by product, SKU, location or rack…"
            activeFilterCount={controls.activeFilterCount}
            onClearFilters={controls.resetFilters}
            emptyIcon={<WarehouseIcon size={18} />}
            emptyTitle="No stock rows match"
            emptyDescription="Adjust the location or status filter."
            filters={
              <>
                <FilterSelect
                  label="Location"
                  value={controls.filters.location ?? 'all'}
                  onChange={(value) => controls.setFilter('location', value)}
                  options={locationOptions}
                />
                <FilterSelect
                  label="Status"
                  value={controls.filters.stock_status ?? 'all'}
                  onChange={(value) => controls.setFilter('stock_status', value)}
                  options={[
                    { value: 'all', label: 'Any status' },
                    { value: 'in_stock', label: 'In stock' },
                    { value: 'low_stock', label: 'Low stock' },
                    { value: 'out_of_stock', label: 'Out of stock' },
                  ]}
                />
              </>
            }
          />
        </TabPanel>

        <TabPanel value="low" className="pt-4">
          <DataTable
            label="Low stock"
            columns={buildColumns()}
            data={lowStockQuery.data?.rows ?? []}
            total={lowStockQuery.data?.total ?? 0}
            page={lowStockQuery.data?.page ?? lowStockControls.page}
            perPage={lowStockControls.perPage}
            totalPages={lowStockQuery.data?.totalPages ?? 1}
            onPageChange={lowStockControls.setPage}
            onPerPageChange={lowStockControls.setPerPage}
            sortBy={lowStockControls.sortBy}
            sortDir={lowStockControls.sortDir}
            onSortChange={lowStockControls.toggleSort}
            loading={lowStockQuery.isLoading}
            fetching={lowStockQuery.isFetching && !lowStockQuery.isLoading}
            error={lowStockQuery.error}
            onRetry={() => void lowStockQuery.refetch()}
            search={lowStockControls.search}
            onSearchChange={lowStockControls.setSearch}
            searchPlaceholder="Search low-stock rows…"
            emptyIcon={<WarehouseIcon size={18} />}
            emptyTitle="Nothing needs reordering"
            emptyDescription="Every stock row is above its reorder point."
            filters={
              <FilterSelect
                label="Severity"
                value={lowStockControls.filters.stock_status ?? 'low_stock'}
                onChange={(value) => lowStockControls.setFilter('stock_status', value)}
                options={[
                  { value: 'low_stock', label: 'Low stock' },
                  { value: 'out_of_stock', label: 'Out of stock' },
                ]}
              />
            }
          />
        </TabPanel>

        <TabPanel value="movements" className="pt-4">
          <MovementLog />
        </TabPanel>
      </Tabs>

      <Dialog
        open={adjusting !== null}
        onOpenChange={(open) => {
          if (!open) setAdjusting(null);
        }}
        size="sm"
        title="Adjust stock"
        description={
          adjusting
            ? `${adjusting.product_name} at ${adjusting.location_name} — currently ${adjusting.quantity} on hand.`
            : undefined
        }
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit((values) => {
            if (!adjusting) return;
            adjustMutation.mutate({ id: adjusting.id, values });
          })(event);
        }}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setAdjusting(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={adjustMutation.isPending}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <FieldGrid>
          <NumberField
            form={form}
            name="delta"
            label="Change"
            step={1}
            required
            hint="Positive to receive, negative to remove"
          />
          <SelectField form={form} name="reason" label="Reason" options={REASON_OPTIONS} required />
          <FieldSpan>
            <TextareaField
              form={form}
              name="note"
              label="Note"
              rows={2}
              placeholder="Delivery reference, damage report, count sheet…"
            />
          </FieldSpan>
        </FieldGrid>
      </Dialog>
    </div>
  );
}
