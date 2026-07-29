import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Article, PencilSimple, Plus, Star, TrashSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { blogPostsService } from '@/services/content';
import { qk } from '@/lib/query-keys';
import { formatDate, formatNumber } from '@/lib/format';
import { POST_STATUS_TONE } from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import type { BlogPostListItem } from '@/types/domain';

export default function BlogListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });
  const [pendingDelete, setPendingDelete] = useState<BlogPostListItem | null>(null);

  const query = useQuery({
    queryKey: qk.list('blog-posts', controls.params),
    queryFn: () => blogPostsService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const tagsQuery = useQuery({ queryKey: qk.blogTags(), queryFn: () => blogPostsService.tags() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('blog-posts') });
    void queryClient.invalidateQueries({ queryKey: qk.blogTags() });
  };

  const patchMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<BlogPostListItem> }) =>
      blogPostsService.patch(id, changes),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(errorMessage(error, 'Could not update that post')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => blogPostsService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Post deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that post')),
  });

  const columns = useMemo<ColumnDef<BlogPostListItem, unknown>[]>(
    () => [
      {
        id: 'title',
        header: 'Post',
        meta: { sortKey: 'title', title: 'Post', cellClassName: 'max-w-[28rem]' },
        cell: ({ row }) => (
          <PrimaryCell
            image={row.original.cover_image}
            title={row.original.title}
            subtitle={row.original.excerpt}
            badge={row.original.is_featured ? <Badge tone="brand">Featured</Badge> : undefined}
          />
        ),
      },
      {
        id: 'author_name',
        header: 'Author',
        meta: { title: 'Author' },
        cell: ({ row }) => <MutedCell>{row.original.author_name}</MutedCell>,
      },
      {
        id: 'tags',
        header: 'Tags',
        meta: { title: 'Tags' },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
            {row.original.tags.length > 2 ? (
              <Badge tone="neutral">+{row.original.tags.length - 2}</Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'view_count',
        header: 'Views',
        meta: { sortKey: 'view_count', align: 'end', title: 'Views' },
        cell: ({ row }) => <MutedCell>{formatNumber(row.original.view_count)}</MutedCell>,
      },
      {
        id: 'comment_count',
        header: 'Comments',
        meta: { sortKey: 'comment_count', align: 'end', title: 'Comments' },
        cell: ({ row }) => <MutedCell>{row.original.comment_count}</MutedCell>,
      },
      {
        id: 'published_at',
        header: 'Published',
        meta: { sortKey: 'published_at', title: 'Published' },
        cell: ({ row }) => (
          <MutedCell>
            {row.original.published_at ? formatDate(row.original.published_at) : '—'}
          </MutedCell>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        meta: { sortKey: 'status', title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={POST_STATUS_TONE[row.original.status]} dot>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => navigate(`/blog/${row.original.id}`)}>
              Edit post
            </MenuItem>
            <MenuItem
              icon={<Star size={15} />}
              onSelect={() =>
                patchMutation.mutate({
                  id: row.original.id,
                  changes: { is_featured: !row.original.is_featured },
                })
              }
            >
              {row.original.is_featured ? 'Unfeature' : 'Feature'}
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
        title="Blog posts"
        description="The Magic Show Journal — care guides, collection notes and brand essays."
        actions={
          <Button icon={<Plus size={15} weight="bold" />} onClick={() => navigate('/blog/new')}>
            New post
          </Button>
        }
      />

      <DataTable
        label="Blog posts"
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
        searchPlaceholder="Search posts by title, excerpt, tag or author…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        onRowClick={(row) => navigate(`/blog/${row.id}`)}
        emptyIcon={<Article size={18} />}
        emptyTitle="No posts match"
        emptyDescription="Write the first entry for the journal."
        emptyAction={
          <Button size="sm" icon={<Plus size={14} weight="bold" />} onClick={() => navigate('/blog/new')}>
            New post
          </Button>
        }
        filters={
          <>
            <FilterSelect
              label="Status"
              value={controls.filters.status ?? 'all'}
              onChange={(value) => controls.setFilter('status', value)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <FilterSelect
              label="Tag"
              value={controls.filters.tag ?? 'all'}
              onChange={(value) => controls.setFilter('tag', value)}
              options={[
                { value: 'all', label: 'All tags' },
                ...(tagsQuery.data ?? []).map((tag) => ({ value: tag, label: tag })),
              ]}
            />
          </>
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete “${pendingDelete?.title ?? 'this post'}”?`}
        message="The post and every comment on it are removed from the demo store."
        confirmLabel="Delete post"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
