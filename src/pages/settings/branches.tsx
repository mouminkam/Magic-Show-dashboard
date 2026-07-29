import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Buildings, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions, YES_NO_OPTIONS } from '@/components/data-table/cells';
import { branchHooks } from '@/hooks/resources';
import { branchSchema, type BranchValues } from '@/lib/schemas';
import type { Branch } from '@/types/domain';

const EMPTY: BranchValues = {
  name: '',
  code: '',
  address: '',
  city: '',
  country: 'United Arab Emirates',
  phone: '',
  email: '',
  manager_name: '',
  opening_time: '10:00',
  closing_time: '22:00',
  is_active: true,
};

export default function BranchesPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Branch>): ColumnDef<Branch, unknown>[] => [
      {
        id: 'name',
        header: 'Branch',
        meta: { sortKey: 'name', title: 'Branch' },
        cell: ({ row }) => <PrimaryCell title={row.original.name} subtitle={`${row.original.code} · ${row.original.city}`} />,
      },
      {
        id: 'manager_name',
        header: 'Manager',
        meta: { title: 'Manager' },
        cell: ({ row }) => <MutedCell>{row.original.manager_name || '—'}</MutedCell>,
      },
      {
        id: 'hours',
        header: 'Hours',
        meta: { title: 'Hours' },
        cell: ({ row }) => (
          <span className="tnum text-muted">
            {row.original.opening_time}–{row.original.closing_time}
          </span>
        ),
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'}>
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
              Edit branch
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
    <ResourceCrudPage<Branch, BranchValues>
      title="Branches"
      description="Retail storefronts used for local pickup and in-store stock."
      entityLabel="Branch"
      hooks={branchHooks}
      schema={branchSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        code: row.code,
        address: row.address,
        city: row.city,
        country: row.country,
        phone: row.phone,
        email: row.email,
        manager_name: row.manager_name,
        opening_time: row.opening_time,
        closing_time: row.closing_time,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search branches…"
      defaultSort="name"
      emptyIcon={<Buildings size={18} />}
      filters={(controls) => (
        <FilterSelect
          label="Status"
          value={controls.filters.is_active ?? 'all'}
          onChange={(value) => controls.setFilter('is_active', value)}
          options={YES_NO_OPTIONS}
        />
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="name" label="Name" required />
          <TextField form={form} name="code" label="Code" required />
          <TextField form={form} name="manager_name" label="Manager" />
          <TextField form={form} name="phone" label="Phone" />
          <TextField form={form} name="city" label="City" required />
          <TextField form={form} name="country" label="Country" required />
          <TextField form={form} name="email" label="Email" type="email" />
          <TextField form={form} name="opening_time" label="Opening time" type="time" />
          <TextField form={form} name="closing_time" label="Closing time" type="time" />
          <FieldSpan>
            <TextField form={form} name="address" label="Address" />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" description="Shown as a pickup location on the storefront." />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
