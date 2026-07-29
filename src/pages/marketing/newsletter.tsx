import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowCounterClockwise, Download, Envelope, PencilSimple, Prohibit, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { SelectField, TextField } from '@/components/resource/form-controls';
import { FieldGrid } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { StatTile } from '@/components/ui/stat-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { subscriberHooks } from '@/hooks/resources';
import { newsletterStatsService } from '@/services/marketing';
import { qk } from '@/lib/query-keys';
import { subscriberSchema, type SubscriberValues } from '@/lib/schemas';
import { formatDate } from '@/lib/format';
import type { NewsletterSubscriber } from '@/types/domain';

const EMPTY: SubscriberValues = { email: '', name: '', source: 'footer' };

const SOURCE_OPTIONS = [
  { value: 'footer', label: 'Site footer' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'popup', label: 'Welcome popup' },
  { value: 'import', label: 'Imported' },
];

function StatsStrip() {
  const query = useQuery({
    queryKey: qk.newsletterStats(),
    queryFn: () => newsletterStatsService.get(),
  });

  if (query.isLoading) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[6.5rem]" />
        ))}
      </div>
    );
  }

  const stats = query.data;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Total records" value={String(stats?.total ?? 0)} icon={<Envelope size={14} />} />
      <StatTile label="Subscribed" value={String(stats?.subscribed ?? 0)} />
      <StatTile label="Unsubscribed" value={String(stats?.unsubscribed ?? 0)} />
      <StatTile label="Joined in 30 days" value={String(stats?.last30 ?? 0)} />
    </div>
  );
}

export default function NewsletterPage() {
  const patchMutation = subscriberHooks.usePatch();
  const allQuery = subscriberHooks.useAll();

  const exportCsv = () => {
    const rows = allQuery.data ?? [];
    if (rows.length === 0) {
      toast.error('Nothing to export yet');
      return;
    }
    const header = 'email,name,source,subscribed_at,unsubscribed_at';
    const body = rows
      .map((row) =>
        [row.email, row.name, row.source, row.subscribed_at, row.unsubscribed_at ?? '']
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'magic-show-newsletter.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} subscribers`);
  };

  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<NewsletterSubscriber>): ColumnDef<NewsletterSubscriber, unknown>[] => [
      {
        id: 'email',
        header: 'Subscriber',
        meta: { sortKey: 'email', title: 'Subscriber' },
        cell: ({ row }) => (
          <PrimaryCell title={row.original.email} subtitle={row.original.name || 'No name captured'} />
        ),
      },
      {
        id: 'source',
        header: 'Source',
        meta: { sortKey: 'source', title: 'Source' },
        cell: ({ row }) => <Badge tone="neutral">{row.original.source}</Badge>,
      },
      {
        id: 'subscribed_at',
        header: 'Subscribed',
        meta: { sortKey: 'subscribed_at', title: 'Subscribed' },
        cell: ({ row }) => <MutedCell>{formatDate(row.original.subscribed_at)}</MutedCell>,
      },
      {
        id: 'state',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) =>
          row.original.unsubscribed_at === null ? (
            <Badge tone="positive" dot>
              Subscribed
            </Badge>
          ) : (
            <Badge tone="neutral" dot>
              Left {formatDate(row.original.unsubscribed_at)}
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit record
            </MenuItem>
            {row.original.unsubscribed_at === null ? (
              <MenuItem
                icon={<Prohibit size={15} />}
                onSelect={() =>
                  patchMutation.mutate(
                    { id: row.original.id, changes: { unsubscribed_at: new Date().toISOString() } },
                    { onSuccess: () => toast.success('Subscriber removed from the list') },
                  )
                }
              >
                Unsubscribe
              </MenuItem>
            ) : (
              <MenuItem
                icon={<ArrowCounterClockwise size={15} />}
                onSelect={() =>
                  patchMutation.mutate(
                    { id: row.original.id, changes: { unsubscribed_at: null } },
                    { onSuccess: () => toast.success('Subscriber re-added to the list') },
                  )
                }
              >
                Re-subscribe
              </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [patchMutation],
  );

  return (
    <ResourceCrudPage<NewsletterSubscriber, SubscriberValues>
      title="Newsletter"
      description="Everyone signed up for restock alerts and collection previews."
      entityLabel="Subscriber"
      hooks={subscriberHooks}
      schema={subscriberSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({ email: row.email, name: row.name, source: row.source })}
      columns={columns}
      searchPlaceholder="Search by email or name…"
      defaultSort="subscribed_at"
      defaultSortDir="desc"
      dialogSize="sm"
      emptyIcon={<Envelope size={18} />}
      headerActions={
        <Button variant="outline" icon={<Download size={15} />} onClick={exportCsv}>
          Export CSV
        </Button>
      }
      filters={(controls) => (
        <>
          <FilterSelect
            label="Status"
            value={controls.filters.state ?? 'all'}
            onChange={(value) => controls.setFilter('state', value)}
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'subscribed', label: 'Subscribed' },
              { value: 'unsubscribed', label: 'Unsubscribed' },
            ]}
          />
          <FilterSelect
            label="Source"
            value={controls.filters.source ?? 'all'}
            onChange={(value) => controls.setFilter('source', value)}
            options={[{ value: 'all', label: 'All sources' }, ...SOURCE_OPTIONS]}
          />
        </>
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="email" label="Email" type="email" required />
          <TextField form={form} name="name" label="Name" />
          <SelectField form={form} name="source" label="Source" options={SOURCE_OPTIONS} required />
        </FieldGrid>
      )}
    >
      <StatsStrip />
    </ResourceCrudPage>
  );
}
