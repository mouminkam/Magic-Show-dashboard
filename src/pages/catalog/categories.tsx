import { useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, Stack, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import {
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  NumberField,
} from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { categoryHooks } from '@/hooks/resources';
import { categorySchema, type CategoryValues } from '@/lib/schemas';
import { formatDate } from '@/lib/format';
import type { Category } from '@/types/domain';

const EMPTY: CategoryValues = {
  name: '',
  slug: '',
  description: '',
  parent_id: null,
  sort_order: 0,
  is_active: true,
  meta_title: '',
  meta_description: '',
};

export default function CategoriesPage() {
  const allQuery = categoryHooks.useAll();
  const categories = useMemo(() => allQuery.data ?? [], [allQuery.data]);

  const parentOptions = useMemo(
    () => [
      { value: '', label: 'No parent (top level)' },
      ...categories
        .filter((category) => category.parent_id === null)
        .map((category) => ({ value: String(category.id), label: category.name })),
    ],
    [categories],
  );

  const nameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Category>): ColumnDef<Category, unknown>[] => [
      {
        id: 'name',
        header: 'Category',
        meta: { sortKey: 'name', title: 'Category' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.name}
            subtitle={`/${row.original.slug}`}
            badge={
              row.original.parent_id === null ? (
                <Badge tone="neutral">Top level</Badge>
              ) : undefined
            }
          />
        ),
      },
      {
        id: 'parent',
        header: 'Parent',
        meta: { title: 'Parent' },
        cell: ({ row }) => (
          <MutedCell>
            {row.original.parent_id === null ? '—' : (nameById.get(row.original.parent_id) ?? '—')}
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
        meta: { sortKey: 'is_active', title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'} dot>
            {row.original.is_active ? 'Active' : 'Hidden'}
          </Badge>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        meta: { sortKey: 'created_at', title: 'Created' },
        cell: ({ row }) => <MutedCell>{formatDate(row.original.created_at)}</MutedCell>,
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit category
            </MenuItem>
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [nameById],
  );

  return (
    <ResourceCrudPage<Category, CategoryValues>
      title="Categories"
      description="The two-level tree the storefront navigation is built from. Parents group the range; children hold the products."
      entityLabel="Category"
      hooks={categoryHooks}
      schema={categorySchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        parent_id: row.parent_id,
        sort_order: row.sort_order,
        is_active: row.is_active,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
      })}
      columns={columns}
      searchPlaceholder="Search categories by name or slug…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      emptyIcon={<Stack size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Level"
            value={controls.filters.parent_id ?? 'all'}
            onChange={(value) => controls.setFilter('parent_id', value)}
            options={[
              { value: 'all', label: 'All levels' },
              { value: 'root', label: 'Top level only' },
              ...categories
                .filter((category) => category.parent_id === null)
                .map((category) => ({ value: String(category.id), label: `In ${category.name}` })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={controls.filters.is_active ?? 'all'}
            onChange={(value) => controls.setFilter('is_active', value)}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Hidden' },
            ]}
          />
        </>
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Name" required placeholder="Sneakers" />
          <TextField
            form={form}
            name="slug"
            label="Slug"
            hint="Leave blank to generate from the name"
            placeholder="sneakers"
          />
          <SelectField
            form={form}
            name="parent_id"
            label="Parent category"
            options={parentOptions}
            placeholder="No parent (top level)"
          />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <TextareaField
              form={form}
              name="description"
              label="Description"
              rows={3}
              placeholder="What belongs in this category and who it is for."
            />
          </FieldSpan>
          <TextField form={form} name="meta_title" label="Meta title" />
          <TextField form={form} name="meta_description" label="Meta description" />
          <FieldSpan>
            <SwitchField
              form={form}
              name="is_active"
              label="Visible on the storefront"
              description="Hidden categories stay in the admin but disappear from navigation and filters."
            />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
