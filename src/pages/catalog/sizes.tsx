import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, Ruler, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { NumberField, SelectField, SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, RowActions } from '@/components/data-table/cells';
import { sizeHooks } from '@/hooks/resources';
import { sizeSchema, type SizeValues } from '@/lib/schemas';
import type { Size } from '@/types/domain';

const EMPTY: SizeValues = { name: '', scale: 'eu', sort_order: 0, is_active: true };

const SCALE_OPTIONS = [
  { value: 'eu', label: 'EU (footwear)' },
  { value: 'uk', label: 'UK (footwear)' },
  { value: 'us', label: 'US (footwear)' },
  { value: 'alpha', label: 'Alpha (apparel)' },
];

const SCALE_LABEL: Record<Size['scale'], string> = {
  eu: 'EU',
  uk: 'UK',
  us: 'US',
  alpha: 'Alpha',
};

export default function SizesPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Size>): ColumnDef<Size, unknown>[] => [
      {
        id: 'name',
        header: 'Size',
        meta: { sortKey: 'name', title: 'Size' },
        cell: ({ row }) => (
          <span className="inline-flex h-7 min-w-[3rem] items-center justify-center rounded-md bg-sunken px-2 font-medium text-ink ring-1 ring-inset ring-line">
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'scale',
        header: 'Scale',
        meta: { sortKey: 'scale', title: 'Scale' },
        cell: ({ row }) => <Badge tone="neutral">{SCALE_LABEL[row.original.scale]}</Badge>,
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
            {row.original.is_active ? 'Active' : 'Retired'}
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
              Edit size
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
    <ResourceCrudPage<Size, SizeValues>
      title="Sizes"
      description="Size runs used across footwear and apparel. Sort order controls how they appear on the product page."
      entityLabel="Size"
      hooks={sizeHooks}
      schema={sizeSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        scale: row.scale,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search sizes…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      dialogSize="sm"
      emptyIcon={<Ruler size={18} />}
      filters={(controls) => (
        <FilterSelect
          label="Scale"
          value={controls.filters.scale ?? 'all'}
          onChange={(value) => controls.setFilter('scale', value)}
          options={[{ value: 'all', label: 'All scales' }, ...SCALE_OPTIONS]}
        />
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Label" required placeholder="EU 42" />
          <SelectField form={form} name="scale" label="Scale" options={SCALE_OPTIONS} required />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <SwitchField
              form={form}
              name="is_active"
              label="Available for new products"
              description="Retired sizes remain on existing variants."
            />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
