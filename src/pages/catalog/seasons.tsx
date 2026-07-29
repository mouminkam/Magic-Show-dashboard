import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Compass, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { NumberField, SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { seasonHooks } from '@/hooks/resources';
import { seasonSchema, type SeasonValues } from '@/lib/schemas';
import { formatDate } from '@/lib/format';
import type { Season } from '@/types/domain';

const EMPTY: SeasonValues = { name: '', value: '', sort_order: 0, is_active: true };

export default function SeasonsPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Season>): ColumnDef<Season, unknown>[] => [
      {
        id: 'name',
        header: 'Season',
        meta: { sortKey: 'name', title: 'Season' },
        cell: ({ row }) => (
          <PrimaryCell title={row.original.name} subtitle={<code>{row.original.value}</code>} />
        ),
      },
      {
        id: 'sort_order',
        header: 'Order',
        meta: { sortKey: 'sort_order', align: 'end', title: 'Order' },
        cell: ({ row }) => <span className="tnum text-muted">{row.original.sort_order}</span>,
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'} dot>
            {row.original.is_active ? 'Selling' : 'Closed'}
          </Badge>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        meta: { title: 'Created' },
        cell: ({ row }) => <span className="text-muted">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit season
            </MenuItem>
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [],
  );

  return (
    <ResourceCrudPage<Season, SeasonValues>
      title="Seasons"
      description="Collection windows. Products are tagged to a season so the storefront can retire a range without unpublishing it."
      entityLabel="Season"
      hooks={seasonHooks}
      schema={seasonSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        value: row.value,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search seasons…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      dialogSize="sm"
      emptyIcon={<Compass size={18} />}
      filters={(controls) => (
        <FilterSelect
          label="Status"
          value={controls.filters.is_active ?? 'all'}
          onChange={(value) => controls.setFilter('is_active', value)}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'true', label: 'Selling' },
            { value: 'false', label: 'Closed' },
          ]}
        />
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Name" required placeholder="Autumn / Winter 26" />
          <TextField form={form} name="value" label="Code" required placeholder="aw26" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <SwitchField
              form={form}
              name="is_active"
              label="Currently selling"
              description="Closed seasons stay attached to their products but drop out of storefront filters."
            />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
