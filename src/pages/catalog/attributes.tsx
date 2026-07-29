import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, SlidersHorizontal, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import {
  NumberField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { attributeHooks } from '@/hooks/resources';
import { productAttributeSchema, type ProductAttributeValues } from '@/lib/schemas';
import type { ProductAttribute } from '@/types/domain';

const EMPTY: ProductAttributeValues = {
  name: '',
  slug: '',
  description: '',
  type: 'select',
  is_required: false,
  is_filterable: true,
  is_visible: true,
  sort_order: 0,
  options: '',
};

const TYPE_OPTIONS = [
  { value: 'select', label: 'Select (one of a list)' },
  { value: 'text', label: 'Free text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / no' },
  { value: 'color', label: 'Colour swatch' },
];

export default function AttributesPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<ProductAttribute>): ColumnDef<ProductAttribute, unknown>[] => [
      {
        id: 'name',
        header: 'Attribute',
        meta: { sortKey: 'name', title: 'Attribute' },
        cell: ({ row }) => <PrimaryCell title={row.original.name} subtitle={`/${row.original.slug}`} />,
      },
      {
        id: 'type',
        header: 'Type',
        meta: { sortKey: 'type', title: 'Type' },
        cell: ({ row }) => <Badge tone="info">{row.original.type}</Badge>,
      },
      {
        id: 'options',
        header: 'Options',
        meta: { title: 'Options', cellClassName: 'max-w-[22rem]' },
        cell: ({ row }) =>
          row.original.options.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.options.slice(0, 3).map((option) => (
                <Badge key={option} tone="neutral">
                  {option}
                </Badge>
              ))}
              {row.original.options.length > 3 ? (
                <Badge tone="neutral">+{row.original.options.length - 3}</Badge>
              ) : null}
            </div>
          ) : (
            <MutedCell>—</MutedCell>
          ),
      },
      {
        id: 'flags',
        header: 'Behaviour',
        meta: { title: 'Behaviour' },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.is_required ? <Badge tone="caution">Required</Badge> : null}
            {row.original.is_filterable ? <Badge tone="brand">Filterable</Badge> : null}
            {!row.original.is_visible ? <Badge tone="neutral">Hidden</Badge> : null}
          </div>
        ),
      },
      {
        id: 'sort_order',
        header: 'Order',
        meta: { sortKey: 'sort_order', align: 'end', title: 'Order' },
        cell: ({ row }) => <span className="tnum text-muted">{row.original.sort_order}</span>,
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit attribute
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
    <ResourceCrudPage<ProductAttribute, ProductAttributeValues>
      title="Product attributes"
      description="Merchandising fields shown on the product page and, where filterable, in the storefront sidebar."
      entityLabel="Attribute"
      hooks={attributeHooks}
      schema={productAttributeSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        type: row.type,
        is_required: row.is_required,
        is_filterable: row.is_filterable,
        is_visible: row.is_visible,
        sort_order: row.sort_order,
        options: row.options.join(', '),
      })}
      columns={columns}
      searchPlaceholder="Search attributes or their options…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      emptyIcon={<SlidersHorizontal size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Type"
            value={controls.filters.type ?? 'all'}
            onChange={(value) => controls.setFilter('type', value)}
            options={[{ value: 'all', label: 'All types' }, ...TYPE_OPTIONS]}
          />
          <FilterSelect
            label="Filterable"
            value={controls.filters.is_filterable ?? 'all'}
            onChange={(value) => controls.setFilter('is_filterable', value)}
            options={[
              { value: 'all', label: 'All attributes' },
              { value: 'true', label: 'Filterable' },
              { value: 'false', label: 'Not filterable' },
            ]}
          />
        </>
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Name" required placeholder="Sole Construction" />
          <SelectField form={form} name="type" label="Type" options={TYPE_OPTIONS} required />
          <TextField form={form} name="slug" label="Slug" hint="Generated from the name if blank" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <TextareaField
              form={form}
              name="options"
              label="Options"
              rows={2}
              hint="Comma separated. Only used by select attributes."
              placeholder="Goodyear welt, Cupsole, Vulcanised"
            />
          </FieldSpan>
          <FieldSpan>
            <TextareaField form={form} name="description" label="Internal note" rows={2} />
          </FieldSpan>
          <SwitchField form={form} name="is_required" label="Required on every product" />
          <SwitchField form={form} name="is_filterable" label="Show as a storefront filter" />
          <FieldSpan>
            <SwitchField
              form={form}
              name="is_visible"
              label="Visible on the product page"
              description="Turn off for attributes used purely for internal merchandising."
            />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
