import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, ChatCircleDots, Envelope, EnvelopeOpen, EnvelopeSimpleOpen, TrashSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { contactMessagesService } from '@/services/content';
import { qk } from '@/lib/query-keys';
import { formatDateTime } from '@/lib/format';
import { CONTACT_STATUS_TONE } from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import type { ContactMessage } from '@/types/domain';

const STATUS_LABEL: Record<ContactMessage['status'], string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'created_at', sortDir: 'desc' });
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);

  const query = useQuery({
    queryKey: qk.list('messages', controls.params),
    queryFn: () => contactMessagesService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const countsQuery = useQuery({
    queryKey: qk.messageCounts(),
    queryFn: () => contactMessagesService.counts(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('messages') });
    void queryClient.invalidateQueries({ queryKey: qk.messageCounts() });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactMessage['status'] }) =>
      contactMessagesService.setStatus(id, status),
    onSuccess: (message) => {
      invalidate();
      setActive(message);
      toast.success(`Marked as ${STATUS_LABEL[message.status].toLowerCase()}`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that message')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => contactMessagesService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Message deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that message')),
  });

  const open = (message: ContactMessage) => {
    setActive(message);
    if (message.status === 'new') statusMutation.mutate({ id: message.id, status: 'read' });
  };

  const columns: ColumnDef<ContactMessage, unknown>[] = [
    {
      id: 'name',
      header: 'From',
      meta: { sortKey: 'name', title: 'From' },
      cell: ({ row }) => (
        <PrimaryCell
          title={`${row.original.first_name} ${row.original.last_name}`}
          subtitle={row.original.email}
          badge={row.original.status === 'new' ? <Badge tone="brand">New</Badge> : undefined}
        />
      ),
    },
    {
      id: 'subject',
      header: 'Subject',
      meta: { sortKey: 'subject', title: 'Subject', cellClassName: 'max-w-[24rem]' },
      cell: ({ row }) => (
        <div>
          <p className="truncate font-medium text-ink">{row.original.subject}</p>
          <p className="line-clamp-1 text-[12px] text-muted">{row.original.message}</p>
        </div>
      ),
    },
    {
      id: 'created_at',
      header: 'Received',
      meta: { sortKey: 'created_at', title: 'Received' },
      cell: ({ row }) => <MutedCell>{formatDateTime(row.original.created_at)}</MutedCell>,
    },
    {
      id: 'status',
      header: 'Status',
      meta: { title: 'Status' },
      cell: ({ row }) => (
        <Badge tone={CONTACT_STATUS_TONE[row.original.status]} dot>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      meta: { locked: true, align: 'end', cellClassName: 'w-14' },
      cell: ({ row }) => (
        <RowActions>
          <MenuItem icon={<EnvelopeOpen size={15} />} onSelect={() => open(row.original)}>
            Open message
          </MenuItem>
          <MenuItem
            icon={<EnvelopeSimpleOpen size={15} />}
            onSelect={() => statusMutation.mutate({ id: row.original.id, status: 'replied' })}
          >
            Mark as replied
          </MenuItem>
          <MenuItem
            icon={<Archive size={15} />}
            onSelect={() => statusMutation.mutate({ id: row.original.id, status: 'archived' })}
          >
            Archive
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => setPendingDelete(row.original)}>
            Delete
          </MenuItem>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Messages"
        description="Enquiries submitted through the storefront contact form."
        actions={
          countsQuery.data ? (
            <Badge tone="brand">{countsQuery.data.new} unread</Badge>
          ) : undefined
        }
      />

      <DataTable
        label="Messages"
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
        searchPlaceholder="Search messages…"
        onRowClick={open}
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        emptyIcon={<ChatCircleDots size={18} />}
        emptyTitle="No messages"
        emptyDescription="Nothing matches the current filters."
        filters={
          <FilterSelect
            label="Status"
            value={controls.filters.status ?? 'all'}
            onChange={(value) => controls.setFilter('status', value)}
            options={[
              { value: 'all', label: 'All messages' },
              { value: 'new', label: 'New' },
              { value: 'read', label: 'Read' },
              { value: 'replied', label: 'Replied' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        }
      />

      <Dialog
        open={active !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActive(null);
        }}
        title={active?.subject ?? ''}
        description={active ? `${active.first_name} ${active.last_name} · ${active.email}` : undefined}
        size="md"
        footer={
          active ? (
            <>
              <Button variant="ghost" onClick={() => setActive(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                icon={<Envelope size={15} />}
                onClick={() => {
                  window.location.href = `mailto:${active.email}?subject=${encodeURIComponent(`Re: ${active.subject}`)}`;
                  statusMutation.mutate({ id: active.id, status: 'replied' });
                }}
              >
                Reply by email
              </Button>
            </>
          ) : null
        }
      >
        {active ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
              <Badge tone={CONTACT_STATUS_TONE[active.status]} dot>
                {STATUS_LABEL[active.status]}
              </Badge>
              <span>{formatDateTime(active.created_at)}</span>
              {active.phone ? <span>· {active.phone}</span> : null}
            </div>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink">{active.message}</p>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPendingDelete(null);
        }}
        title="Delete this message?"
        message="The enquiry is permanently removed from the inbox."
        confirmLabel="Delete message"
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
