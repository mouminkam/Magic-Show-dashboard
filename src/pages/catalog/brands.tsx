import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowSquareOut, PencilSimple, Sparkle, TrashSimple } from '@phosphor-icons/react';
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
import { brandHooks } from '@/hooks/resources';
import { brandSchema, type BrandValues } from '@/lib/schemas';
import { BRAND_COUNTRIES } from '@/mocks/content';
import type { Brand } from '@/types/domain';

const EMPTY: BrandValues = {
  name: '',
  slug: '',
  description: '',
  website: '',
  contact_email: '',
  contact_phone: '',
  country: '',
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

export default function BrandsPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Brand>): ColumnDef<Brand, unknown>[] => [
      {
        id: 'name',
        header: 'Brand',
        meta: { sortKey: 'name', title: 'Brand' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.name}
            subtitle={row.original.contact_email || `/${row.original.slug}`}
            badge={row.original.is_featured ? <Badge tone="brand">Featured</Badge> : undefined}
          />
        ),
      },
      {
        id: 'country',
        header: 'Country',
        meta: { sortKey: 'country', title: 'Country' },
        cell: ({ row }) => <MutedCell>{row.original.country || '—'}</MutedCell>,
      },
      {
        id: 'website',
        header: 'Website',
        meta: { title: 'Website' },
        cell: ({ row }) =>
          row.original.website ? (
            <a
              href={row.original.website}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              {row.original.website.replace(/^https?:\/\/(www\.)?/, '')}
              <ArrowSquareOut size={12} aria-hidden />
            </a>
          ) : (
            <MutedCell>—</MutedCell>
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
            {row.original.is_active ? 'Active' : 'Inactive'}
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
              Edit brand
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
    <ResourceCrudPage<Brand, BrandValues>
      title="Brands"
      description="Suppliers and in-house labels. Featured brands surface on the storefront home page."
      entityLabel="Brand"
      hooks={brandHooks}
      schema={brandSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        website: row.website,
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        country: row.country,
        is_active: row.is_active,
        is_featured: row.is_featured,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search brands by name, country or email…"
      defaultSort="name"
      defaultSortDir="asc"
      emptyIcon={<Sparkle size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Country"
            value={controls.filters.country ?? 'all'}
            onChange={(value) => controls.setFilter('country', value)}
            options={[
              { value: 'all', label: 'All countries' },
              ...BRAND_COUNTRIES.map((country) => ({ value: country, label: country })),
            ]}
          />
          <FilterSelect
            label="Featured"
            value={controls.filters.is_featured ?? 'all'}
            onChange={(value) => controls.setFilter('is_featured', value)}
            options={[
              { value: 'all', label: 'Featured & standard' },
              { value: 'true', label: 'Featured only' },
              { value: 'false', label: 'Standard only' },
            ]}
          />
        </>
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Brand name" required placeholder="Aurelian" />
          <TextField form={form} name="slug" label="Slug" hint="Generated from the name if left blank" />
          <TextField form={form} name="country" label="Country of origin" placeholder="Italy" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <TextField form={form} name="website" label="Website" type="url" placeholder="https://example.com" />
          <TextField
            form={form}
            name="contact_email"
            label="Wholesale contact"
            type="email"
            placeholder="wholesale@example.com"
          />
          <TextField form={form} name="contact_phone" label="Contact phone" />
          <FieldSpan>
            <TextareaField form={form} name="description" label="Description" rows={3} />
          </FieldSpan>
          <SwitchField
            form={form}
            name="is_active"
            label="Active"
            description="Inactive brands are hidden from storefront filters."
          />
          <SwitchField
            form={form}
            name="is_featured"
            label="Featured"
            description="Featured brands appear in the home page brand rail."
          />
        </FieldGrid>
      )}
    />
  );
}
