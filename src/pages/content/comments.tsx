import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { ChatsCircle, CheckCircle, TrashSimple, XCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { blogCommentsService, blogPostsService } from '@/services/content';
import { qk } from '@/lib/query-keys';
import { formatDateTime } from '@/lib/format';
import { errorMessage } from '@/lib/utils';
import type { BlogCommentListItem } from '@/types/domain';

export default function CommentsPage() {
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });
  const [pendingDelete, setPendingDelete] = useState<BlogCommentListItem | null>(null);

  const query = useQuery({
    queryKey: qk.list('comments', controls.params),
    queryFn: () => blogCommentsService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const postsQuery = useQuery({
    queryKey: qk.list('blog-posts', { perPage: 0 }),
    queryFn: () => blogPostsService.list({ perPage: 0 }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('comments') });
    void queryClient.invalidateQueries({ queryKey: qk.resource('blog-posts') });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const approvalMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      blogCommentsService.setApproval(id, approved),
    onSuccess: (comment) => {
      invalidate();
      toast.success(comment.is_approved ? 'Comment approved' : 'Comment hidden');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that comment')),
  });

  const bulkApprove = useMutation({
    mutationFn: (ids: number[]) => blogCommentsService.bulkApprove(ids),
    onSuccess: (result) => {
      invalidate();
      toast.success(`${result.updated} comment${result.updated === 1 ? '' : 's'} approved`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not approve those comments')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => blogCommentsService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Comment deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that comment')),
  });

  const columns = useMemo<ColumnDef<BlogCommentListItem, unknown>[]>(
    () => [
      {
        id: 'author_name',
        header: 'Author',
        meta: { sortKey: 'author_name', title: 'Author' },
        cell: ({ row }) => (
          <PrimaryCell
            image={null}
            imageRounded="full"
            title={row.original.author_name}
            subtitle={row.original.author_email}
          />
        ),
      },
      {
        id: 'comment',
        header: 'Comment',
        meta: { title: 'Comment', cellClassName: 'max-w-[30rem]' },
        cell: ({ row }) => (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{row.original.comment}</p>
        ),
      },
      {
        id: 'post_title',
        header: 'On post',
        meta: { sortKey: 'post_title', title: 'On post', cellClassName: 'max-w-[16rem]' },
        cell: ({ row }) => (
          <MutedCell>
            <span className="line-clamp-1">{row.original.post_title}</span>
          </MutedCell>
        ),
      },
      {
        id: 'created_at',
        header: 'Submitted',
        meta: { sortKey: 'created_at', title: 'Submitted' },
        cell: ({ row }) => <MutedCell>{formatDateTime(row.original.created_at)}</MutedCell>,
      },
      {
        id: 'is_approved',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_approved ? 'positive' : 'caution'} dot>
            {row.original.is_approved ? 'Approved' : 'Pending'}
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
              {row.original.is_approved ? 'Hide comment' : 'Approve comment'}
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
    [approvalMutation],
  );

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Comments"
        description="Moderation queue for the journal. Nothing appears on the storefront until it is approved."
      />

      <DataTable
        label="Comments"
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
        searchPlaceholder="Search comments, authors or posts…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        emptyIcon={<ChatsCircle size={18} />}
        emptyTitle="Nothing to moderate"
        emptyDescription="No comments match the current filters."
        filters={
          <>
            <FilterSelect
              label="Status"
              value={controls.filters.is_approved ?? 'all'}
              onChange={(value) => controls.setFilter('is_approved', value)}
              options={[
                { value: 'all', label: 'All comments' },
                { value: 'false', label: 'Pending approval' },
                { value: 'true', label: 'Approved' },
              ]}
            />
            <FilterSelect
              label="Post"
              value={controls.filters.blog_post_id ?? 'all'}
              onChange={(value) => controls.setFilter('blog_post_id', value)}
              options={[
                { value: 'all', label: 'All posts' },
                ...(postsQuery.data?.rows ?? []).map((post) => ({
                  value: String(post.id),
                  label: post.title,
                })),
              ]}
            />
          </>
        }
        selectionActions={(ids, clear) => (
          <Button
            variant="outline"
            size="sm"
            loading={bulkApprove.isPending}
            onClick={() => bulkApprove.mutate(ids, { onSuccess: clear })}
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
        title="Delete this comment?"
        message="The comment is removed from the post and the moderation queue."
        confirmLabel="Delete comment"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
