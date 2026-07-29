import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, Quotes, Star, TrashSimple } from '@phosphor-icons/react';
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
import { FilterSelect, PrimaryCell, RowActions } from '@/components/data-table/cells';
import { testimonialHooks } from '@/hooks/resources';
import { testimonialSchema, type TestimonialValues } from '@/lib/schemas';
import { avatarImage } from '@/mocks/imagery';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/types/domain';

const EMPTY: TestimonialValues = {
  customer_name: '',
  customer_role: '',
  text: '',
  rating: 5,
  is_featured: false,
  sort_order: 0,
};

export default function TestimonialsPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Testimonial>): ColumnDef<Testimonial, unknown>[] => [
      {
        id: 'customer_name',
        header: 'Customer',
        meta: { sortKey: 'customer_name', title: 'Customer' },
        cell: ({ row }) => (
          <PrimaryCell
            image={avatarImage(row.original.customer_name)}
            imageRounded="full"
            title={row.original.customer_name}
            subtitle={row.original.customer_role}
            badge={row.original.is_featured ? <Badge tone="brand">Featured</Badge> : undefined}
          />
        ),
      },
      {
        id: 'text',
        header: 'Quote',
        meta: { title: 'Quote', cellClassName: 'max-w-[30rem]' },
        cell: ({ row }) => (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">“{row.original.text}”</p>
        ),
      },
      {
        id: 'rating',
        header: 'Rating',
        meta: { sortKey: 'rating', title: 'Rating' },
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-0.5" aria-label={`${row.original.rating} of 5`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                size={13}
                weight={value <= row.original.rating ? 'fill' : 'regular'}
                className={cn(value <= row.original.rating ? 'text-caution' : 'text-faint')}
                aria-hidden
              />
            ))}
          </span>
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
              Edit testimonial
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
    <ResourceCrudPage<Testimonial, TestimonialValues>
      title="Testimonials"
      description="Curated quotes used on the home page and the about page. Featured entries appear first."
      entityLabel="Testimonial"
      hooks={testimonialHooks}
      schema={testimonialSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        customer_name: row.customer_name,
        customer_role: row.customer_role,
        text: row.text,
        rating: row.rating,
        is_featured: row.is_featured,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search testimonials…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      emptyIcon={<Quotes size={18} />}
      filters={(controls) => (
        <FilterSelect
          label="Featured"
          value={controls.filters.is_featured ?? 'all'}
          onChange={(value) => controls.setFilter('is_featured', value)}
          options={[
            { value: 'all', label: 'All testimonials' },
            { value: 'true', label: 'Featured only' },
            { value: 'false', label: 'Not featured' },
          ]}
        />
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="customer_name" label="Customer name" required />
          <TextField form={form} name="customer_role" label="Role / location" placeholder="Architect, Dubai" />
          <FieldSpan>
            <TextareaField form={form} name="text" label="Quote" rows={4} required />
          </FieldSpan>
          <NumberField form={form} name="rating" label="Rating" min={1} max={5} step={1} />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <SwitchField
              form={form}
              name="is_featured"
              label="Feature on the home page"
              description="Featured testimonials appear in the storefront carousel."
            />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
