import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Palette, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { ColorField, NumberField, SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, RowActions } from '@/components/data-table/cells';
import { colorHooks } from '@/hooks/resources';
import { colorSchema, type ColorValues } from '@/lib/schemas';
import type { Color } from '@/types/domain';

const EMPTY: ColorValues = {
  name: '',
  hex_code: '#1a1a1a',
  family: 'Black',
  is_active: true,
  sort_order: 0,
};

const FAMILIES = [
  'Black',
  'White',
  'Beige',
  'Brown',
  'Grey',
  'Red',
  'Green',
  'Blue',
  'Pink',
  'Yellow',
  'Purple',
];

export default function ColorsPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Color>): ColumnDef<Color, unknown>[] => [
      {
        id: 'name',
        header: 'Colour',
        meta: { sortKey: 'name', title: 'Colour' },
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span
              className="h-7 w-7 shrink-0 rounded-md ring-1 ring-inset ring-line"
              style={{ backgroundColor: row.original.hex_code }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.original.name}</p>
              <p className="font-mono text-[12px] uppercase text-muted">{row.original.hex_code}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'family',
        header: 'Family',
        meta: { sortKey: 'family', title: 'Family' },
        cell: ({ row }) => <Badge tone="neutral">{row.original.family}</Badge>,
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
              Edit colour
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
    <ResourceCrudPage<Color, ColorValues>
      title="Colours"
      description="The shared swatch library. Product variants reference these, so a rename flows through the whole catalogue."
      entityLabel="Colour"
      hooks={colorHooks}
      schema={colorSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        hex_code: row.hex_code,
        family: row.family,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search colours by name, family or hex…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      dialogSize="sm"
      emptyIcon={<Palette size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Family"
            value={controls.filters.family ?? 'all'}
            onChange={(value) => controls.setFilter('family', value)}
            options={[
              { value: 'all', label: 'All families' },
              ...FAMILIES.map((family) => ({ value: family, label: family })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={controls.filters.is_active ?? 'all'}
            onChange={(value) => controls.setFilter('is_active', value)}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Retired' },
            ]}
          />
        </>
      )}
      renderForm={(form) => (
        <div className="space-y-4">
          <TextField form={form} name="name" label="Colour name" required placeholder="Midnight Navy" />
          <ColorField form={form} name="hex_code" label="Hex value" required />
          <FieldGrid>
            <TextField form={form} name="family" label="Family" required placeholder="Blue" />
            <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
            <FieldSpan>
              <SwitchField
                form={form}
                name="is_active"
                label="Available for new products"
                description="Retired colours stay on historic products but cannot be selected again."
              />
            </FieldSpan>
          </FieldGrid>
        </div>
      )}
    />
  );
}

export { FAMILIES as COLOR_FAMILIES };
