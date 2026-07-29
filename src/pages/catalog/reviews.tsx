import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Star, TrashSimple, XCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { reviewsService } from '@/services/catalog';
import { qk } from '@/lib/query-keys';
import { formatDate } from '@/lib/format';
import { cn, errorMessage } from '@/lib/utils';
import type { ReviewListItem } from '@/types/domain';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={13}
          weight={value <= rating ? 'fill' : 'regular'}
          className={cn(value <= rating ? 'text-caution' : 'text-faint')}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });
  const [pendingDelete, setPendingDelete] = useState<ReviewListItem | null>(null);

  const query = useQuery({
    queryKey: qk.list('reviews', controls.params),
    queryFn: () => reviewsService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('reviews') });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const approvalMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      reviewsService.setApproval(id, approved),
    onSuccess: (review) => {
      invalidate();
      toast.success(review.is_approved ? 'Review published' : 'Review hidden');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that review')),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      reviewsService.setFeatured(id, featured),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(errorMessage(error, 'Could not update that review')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => reviewsService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Review deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that review')),
  });

  const columns = useMemo<ColumnDef<ReviewListItem, unknown>[]>(
    () => [
      {
        id: 'title',
        header: 'Review',
        meta: { title: 'Review', cellClassName: 'max-w-[26rem]' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Stars rating={row.original.rating} />
              <span className="truncate font-medium text-ink">{row.original.title}</span>
              {row.original.is_featured ? <Badge tone="brand">Featured</Badge> : null}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{row.original.comment}</p>
          </div>
        ),
      },
      {
        id: 'product_name',
        header: 'Product',
        meta: { sortKey: 'product_name', title: 'Product' },
        cell: ({ row }) => <span className="text-ink">{row.original.product_name}</span>,
      },
      {
        id: 'customer',
        header: 'Customer',
        meta: { title: 'Customer' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.customer_name}</p>
            {row.original.is_verified_purchase ? (
              <p className="text-[12px] text-positive">Verified purchase</p>
            ) : (
              <p className="text-[12px] text-faint">Unverified</p>
            )}
          </div>
        ),
      },
      {
        id: 'helpful_count',
        header: 'Helpful',
        meta: { sortKey: 'helpful_count', align: 'end', title: 'Helpful' },
        cell: ({ row }) => <MutedCell>{row.original.helpful_count}</MutedCell>,
      },
      {
        id: 'created_at',
        header: 'Submitted',
        meta: { sortKey: 'created_at', title: 'Submitted' },
        cell: ({ row }) => <MutedCell>{formatDate(row.original.created_at)}</MutedCell>,
      },
      {
        id: 'is_approved',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_approved ? 'positive' : 'caution'} dot>
            {row.original.is_approved ? 'Published' : 'Pending'}
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
              icon={row.original.is_approved ? <XCircle size={15} /> : <CheckCircle size={15} />}
              onSelect={() =>
                approvalMutation.mutate({ id: row.original.id, approved: !row.original.is_approved })
              }
            >
              {row.original.is_approved ? 'Hide review' : 'Approve review'}
            </MenuItem>
            <MenuItem
              icon={<Star size={15} />}
              onSelect={() =>
                featureMutation.mutate({ id: row.original.id, featured: !row.original.is_featured })
              }
            >
              {row.original.is_featured ? 'Remove from featured' : 'Feature on storefront'}
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
    [approvalMutation, featureMutation],
  );

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Reviews"
        description="Customer feedback awaiting moderation. Approved reviews feed the rating shown on product pages."
      />

      <DataTable
        label="Reviews"
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
        searchPlaceholder="Search reviews, products or customers…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        emptyIcon={<Star size={18} />}
        emptyTitle="No reviews match"
        emptyDescription="Clear the filters to see the full moderation queue."
        filters={
          <>
            <FilterSelect
              label="Status"
              value={controls.filters.is_approved ?? 'all'}
              onChange={(value) => controls.setFilter('is_approved', value)}
              options={[
                { value: 'all', label: 'All reviews' },
                { value: 'false', label: 'Pending approval' },
                { value: 'true', label: 'Published' },
              ]}
            />
            <FilterSelect
              label="Rating"
              value={controls.filters.rating ?? 'all'}
              onChange={(value) => controls.setFilter('rating', value)}
              options={[
                { value: 'all', label: 'Any rating' },
                { value: '5', label: '5 stars' },
                { value: '4', label: '4 stars' },
                { value: '3', label: '3 stars' },
                { value: '2', label: '2 stars' },
                { value: '1', label: '1 star' },
              ]}
            />
          </>
        }
        selectionActions={(ids, clear) => (
          <Button
            variant="outline"
            size="sm"
            loading={approvalMutation.isPending}
            onClick={async () => {
              for (const id of ids) {
                await approvalMutation.mutateAsync({ id, approved: true }).catch(() => undefined);
              }
              clear();
            }}
          >
            Approve selected
          </Button>
        )}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this review?"
        message="The review is removed from the product page and the moderation queue."
        confirmLabel="Delete review"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
