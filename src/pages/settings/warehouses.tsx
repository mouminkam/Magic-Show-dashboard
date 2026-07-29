import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, TrashSimple, Warehouse as WarehouseIcon } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { NumberField, SelectField, SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions, YES_NO_OPTIONS } from '@/components/data-table/cells';
import { warehouseHooks } from '@/hooks/resources';
import { warehouseSchema, type WarehouseValues } from '@/lib/schemas';
import type { Warehouse } from '@/types/domain';

const TYPE_LABEL: Record<Warehouse['type'], string> = {
  main: 'Main',
  distribution: 'Distribution',
  retail: 'Retail',
  storage: 'Storage',
};

const EMPTY: WarehouseValues = {
  name: '',
  code: '',
  type: 'distribution',
  address: '',
  city: '',
  country: 'United Arab Emirates',
  phone: '',
  email: '',
  manager_name: '',
  capacity: 0,
  capacity_unit: 'pallets',
  is_active: true,
};

export default function WarehousesPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Warehouse>): ColumnDef<Warehouse, unknown>[] => [
      {
        id: 'name',
        header: 'Warehouse',
        meta: { sortKey: 'name', title: 'Warehouse' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.name}
            subtitle={`${row.original.code} · ${row.original.city}`}
            badge={<Badge tone="neutral">{TYPE_LABEL[row.original.type]}</Badge>}
          />
        ),
      },
      {
        id: 'manager_name',
        header: 'Manager',
        meta: { title: 'Manager' },
        cell: ({ row }) => <MutedCell>{row.original.manager_name || '—'}</MutedCell>,
      },
      {
        id: 'capacity',
        header: 'Capacity',
        meta: { sortKey: 'capacity', align: 'end', title: 'Capacity' },
        cell: ({ row }) => (
          <span className="tnum text-ink">
            {row.original.capacity.toLocaleString('en-US')} {row.original.capacity_unit}
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
              Edit warehouse
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
    <ResourceCrudPage<Warehouse, WarehouseValues>
      title="Warehouses"
      description="Stock-holding locations available to inventory and fulfilment."
      entityLabel="Warehouse"
      hooks={warehouseHooks}
      schema={warehouseSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        code: row.code,
        type: row.type,
        address: row.address,
        city: row.city,
        country: row.country,
        phone: row.phone,
        email: row.email,
        manager_name: row.manager_name,
        capacity: row.capacity,
        capacity_unit: row.capacity_unit,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search warehouses…"
      defaultSort="name"
      emptyIcon={<WarehouseIcon size={18} />}
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
          <SelectField
            form={form}
            name="type"
            label="Type"
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <TextField form={form} name="manager_name" label="Manager" />
          <TextField form={form} name="city" label="City" required />
          <TextField form={form} name="country" label="Country" required />
          <TextField form={form} name="phone" label="Phone" />
          <TextField form={form} name="email" label="Email" type="email" />
          <NumberField form={form} name="capacity" label="Capacity" min={0} step={1} />
          <TextField form={form} name="capacity_unit" label="Capacity unit" placeholder="pallets" />
          <FieldSpan>
            <TextField form={form} name="address" label="Address" />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" description="Available for stock allocation." />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
