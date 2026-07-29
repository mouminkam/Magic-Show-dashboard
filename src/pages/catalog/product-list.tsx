import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, Eye, EyeSlash, Package, PencilSimple, Plus, TrashSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MoneyCell, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { brandHooks, categoryHooks, productHooks, seasonHooks } from '@/hooks/resources';
import { productsService } from '@/services/catalog';
import { qk } from '@/lib/query-keys';
import { formatMoney, formatNumber } from '@/lib/format';
import { STOCK_STATUS_LABEL, STOCK_STATUS_TONE } from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import type { ProductListItem } from '@/types/domain';

export default function ProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });

  const query = productHooks.useList(controls.params);
  const categoriesQuery = categoryHooks.useAll();
  const brandsQuery = brandHooks.useAll();
  const seasonsQuery = seasonHooks.useAll();
  const removeMutation = productHooks.useRemove();
  const patchMutation = productHooks.usePatch();

  const [pendingDelete, setPendingDelete] = useState<ProductListItem | null>(null);

  const invalidateProducts = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('products') });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const bulkActive = useMutation({
    mutationFn: ({ ids, active }: { ids: number[]; active: boolean }) =>
      productsService.bulkSetActive(ids, active),
    onSuccess: (result) => {
      invalidateProducts();
      toast.success(`${result.updated} product${result.updated === 1 ? '' : 's'} updated`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update those products')),
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: number[]) => productsService.bulkRemove(ids),
    onSuccess: (result) => {
      invalidateProducts();
      toast.success(`${result.removed} product${result.removed === 1 ? '' : 's'} deleted`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete those products')),
  });

  const columns = useMemo<ColumnDef<ProductListItem, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Product',
        meta: { sortKey: 'name', title: 'Product' },
        cell: ({ row }) => (
          <PrimaryCell
            image={row.original.images[0]?.url ?? null}
            title={row.original.name}
            subtitle={row.original.sku}
            badge={row.original.is_featured ? <Badge tone="brand">Featured</Badge> : undefined}
          />
        ),
      },
      {
        id: 'category_name',
        header: 'Category',
        meta: { sortKey: 'category_name', title: 'Category' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.category_name}</p>
            <p className="truncate text-[12px] text-muted">{row.original.brand_name}</p>
          </div>
        ),
      },
      {
        id: 'price',
        header: 'Price',
        meta: { sortKey: 'price', align: 'end', title: 'Price' },
        cell: ({ row }) => (
          <div className="text-end">
            <MoneyCell>{formatMoney(row.original.sale_price ?? row.original.price)}</MoneyCell>
            {row.original.sale_price !== null ? (
              <p className="text-[12px] text-faint line-through tnum">{formatMoney(row.original.price)}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'quantity',
        header: 'Stock',
        meta: { sortKey: 'quantity', align: 'end', title: 'Stock' },
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-1">
            <span className="tnum font-medium text-ink">{formatNumber(row.original.quantity)}</span>
            <Badge tone={STOCK_STATUS_TONE[row.original.stock_status]} dot>
              {STOCK_STATUS_LABEL[row.original.stock_status]}
            </Badge>
          </div>
        ),
      },
      {
        id: 'units_sold',
        header: 'Sold',
        meta: { sortKey: 'units_sold', align: 'end', title: 'Sold' },
        cell: ({ row }) => <MutedCell>{formatNumber(row.original.units_sold)}</MutedCell>,
      },
      {
        id: 'rating',
        header: 'Rating',
        meta: { sortKey: 'rating', align: 'end', title: 'Rating' },
        cell: ({ row }) =>
          row.original.review_count > 0 ? (
            <div className="text-end">
              <span className="tnum font-medium text-ink">{row.original.rating.toFixed(1)}</span>
              <p className="text-[12px] text-faint tnum">{row.original.review_count} reviews</p>
            </div>
          ) : (
            <MutedCell>—</MutedCell>
          ),
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'} dot>
            {row.original.is_active ? 'Live' : 'Draft'}
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
              icon={<PencilSimple size={15} />}
              onSelect={() => navigate(`/products/${row.original.id}`)}
            >
              Edit product
            </MenuItem>
            <MenuItem
              icon={row.original.is_active ? <EyeSlash size={15} /> : <Eye size={15} />}
              onSelect={() =>
                patchMutation.mutate(
                  { id: row.original.id, changes: { is_active: !row.original.is_active } },
                  {
                    onSuccess: () =>
                      toast.success(row.original.is_active ? 'Product unpublished' : 'Product published'),
                  },
                )
              }
            >
              {row.original.is_active ? 'Unpublish' : 'Publish'}
            </MenuItem>
            <MenuItem
              icon={<Copy size={15} />}
              onSelect={() => {
                void navigator.clipboard?.writeText(row.original.sku);
                toast.success('SKU copied', { description: row.original.sku });
              }}
            >
              Copy SKU
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={<TrashSimple size={15} />}
              destructive
              onSelect={() => setPendingDelete(row.original)}
            >
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [navigate, patchMutation],
  );

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Products"
        description="The full catalogue across footwear, apparel and accessories. Click any row to open the editor."
        actions={
          <Button icon={<Plus size={15} weight="bold" />} onClick={() => navigate('/products/new')}>
            New product
          </Button>
        }
      />

      <DataTable
        label="Products"
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
        searchPlaceholder="Search by name, SKU, brand or model…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        onRowClick={(row) => navigate(`/products/${row.id}`)}
        emptyIcon={<Package size={18} />}
        emptyTitle="No products match"
        emptyDescription="Adjust the filters, or add the first product to the catalogue."
        emptyAction={
          <Button size="sm" icon={<Plus size={14} weight="bold" />} onClick={() => navigate('/products/new')}>
            New product
          </Button>
        }
        filters={
          <>
            <FilterSelect
              label="Category"
              value={controls.filters.category_id ?? 'all'}
              onChange={(value) => controls.setFilter('category_id', value)}
              options={[
                { value: 'all', label: 'All categories' },
                ...(categoriesQuery.data ?? []).map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />
            <FilterSelect
              label="Brand"
              value={controls.filters.brand_id ?? 'all'}
              onChange={(value) => controls.setFilter('brand_id', value)}
              options={[
                { value: 'all', label: 'All brands' },
                ...(brandsQuery.data ?? []).map((brand) => ({
                  value: String(brand.id),
                  label: brand.name,
                })),
              ]}
            />
            <FilterSelect
              label="Season"
              value={controls.filters.season_id ?? 'all'}
              onChange={(value) => controls.setFilter('season_id', value)}
              options={[
                { value: 'all', label: 'All seasons' },
                ...(seasonsQuery.data ?? []).map((season) => ({
                  value: String(season.id),
                  label: season.name,
                })),
              ]}
            />
            <FilterSelect
              label="Stock"
              value={controls.filters.stock_status ?? 'all'}
              onChange={(value) => controls.setFilter('stock_status', value)}
              options={[
                { value: 'all', label: 'Any stock level' },
                { value: 'in_stock', label: 'In stock' },
                { value: 'low_stock', label: 'Low stock' },
                { value: 'out_of_stock', label: 'Out of stock' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={controls.filters.is_active ?? 'all'}
              onChange={(value) => controls.setFilter('is_active', value)}
              options={[
                { value: 'all', label: 'Live & draft' },
                { value: 'true', label: 'Live only' },
                { value: 'false', label: 'Draft only' },
              ]}
            />
          </>
        }
        selectionActions={(ids, clear) => (
          <>
            <Button
              variant="outline"
              size="sm"
              loading={bulkActive.isPending}
              onClick={() => bulkActive.mutate({ ids, active: true }, { onSuccess: clear })}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={bulkActive.isPending}
              onClick={() => bulkActive.mutate({ ids, active: false }, { onSuccess: clear })}
            >
              Unpublish
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={bulkDelete.isPending}
              onClick={() => bulkDelete.mutate(ids, { onSuccess: clear })}
            >
              Delete
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.name ?? 'this product'}?`}
        message="The product, its inventory rows and its reviews are removed from the demo store. Use “Reset demo data” to bring everything back."
        confirmLabel="Delete product"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
}
