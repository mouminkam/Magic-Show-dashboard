import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Drop, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import {
  NumberField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { materialHooks } from '@/hooks/resources';
import { materialSchema, type MaterialValues } from '@/lib/schemas';
import type { Material } from '@/types/domain';

const EMPTY: MaterialValues = {
  name: '',
  slug: '',
  description: '',
  category: 'Leather',
  is_active: true,
  sort_order: 0,
};

const CATEGORIES = ['Leather', 'Textile', 'Synthetic', 'Rubber', 'Composite'];

export default function MaterialsPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Material>): ColumnDef<Material, unknown>[] => [
      {
        id: 'name',
        header: 'Material',
        meta: { sortKey: 'name', title: 'Material' },
        cell: ({ row }) => <PrimaryCell title={row.original.name} subtitle={`/${row.original.slug}`} />,
      },
      {
        id: 'category',
        header: 'Group',
        meta: { sortKey: 'category', title: 'Group' },
        cell: ({ row }) => <Badge tone="neutral">{row.original.category}</Badge>,
      },
      {
        id: 'description',
        header: 'Notes',
        meta: { title: 'Notes', cellClassName: 'max-w-[24rem]' },
        cell: ({ row }) => (
          <MutedCell>
            <span className="line-clamp-1">{row.original.description || '—'}</span>
          </MutedCell>
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
              Edit material
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
    <ResourceCrudPage<Material, MaterialValues>
      title="Materials"
      description="What products are made from. Drives the storefront material filter and the care instructions block."
      entityLabel="Material"
      hooks={materialHooks}
      schema={materialSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        category: row.category,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search materials…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      emptyIcon={<Drop size={18} />}
      filters={(controls) => (
        <FilterSelect
          label="Group"
          value={controls.filters.category ?? 'all'}
          onChange={(value) => controls.setFilter('category', value)}
          options={[
            { value: 'all', label: 'All groups' },
            ...CATEGORIES.map((category) => ({ value: category, label: category })),
          ]}
        />
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Name" required placeholder="Full-Grain Leather" />
          <TextField form={form} name="category" label="Group" required placeholder="Leather" />
          <TextField form={form} name="slug" label="Slug" hint="Generated from the name if blank" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <TextareaField form={form} name="description" label="Description" rows={3} />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
