import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CurrencyCircleDollar, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { NumberField, SelectField, SwitchField, TextField } from '@/components/resource/form-controls';
import { FieldGrid } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, PrimaryCell, RowActions, YES_NO_OPTIONS } from '@/components/data-table/cells';
import { currencyHooks } from '@/hooks/resources';
import { currencySchema, type CurrencyValues } from '@/lib/schemas';
import type { Currency } from '@/types/domain';

const EMPTY: CurrencyValues = {
  code: '',
  name: '',
  symbol: '',
  symbol_position: 'before',
  decimal_places: 2,
  exchange_rate: 1,
  is_base: false,
  is_active: true,
  sort_order: 0,
};

export default function CurrenciesPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Currency>): ColumnDef<Currency, unknown>[] => [
      {
        id: 'code',
        header: 'Currency',
        meta: { sortKey: 'code', title: 'Currency' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.code}
            subtitle={row.original.name}
            badge={row.original.is_base ? <Badge tone="brand">Base</Badge> : undefined}
          />
        ),
      },
      {
        id: 'symbol',
        header: 'Symbol',
        meta: { title: 'Symbol' },
        cell: ({ row }) => <span className="text-muted">{row.original.symbol}</span>,
      },
      {
        id: 'exchange_rate',
        header: 'Rate',
        meta: { sortKey: 'exchange_rate', align: 'end', title: 'Rate' },
        cell: ({ row }) => <span className="tnum text-ink">{row.original.exchange_rate.toFixed(4)}</span>,
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
              Edit currency
            </MenuItem>
            <MenuItem
              icon={<TrashSimple size={15} />}
              destructive
              disabled={row.original.is_base}
              onSelect={() => remove(row.original)}
            >
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [],
  );

  return (
    <ResourceCrudPage<Currency, CurrencyValues>
      title="Currencies"
      description="Exchange rates and formatting for every currency the storefront accepts. The base currency cannot be deleted."
      entityLabel="Currency"
      hooks={currencyHooks}
      schema={currencySchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        code: row.code,
        name: row.name,
        symbol: row.symbol,
        symbol_position: row.symbol_position,
        decimal_places: row.decimal_places,
        exchange_rate: row.exchange_rate,
        is_base: row.is_base,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search currencies…"
      defaultSort="sort_order"
      defaultSortDir="asc"
      emptyIcon={<CurrencyCircleDollar size={18} />}
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
          <TextField form={form} name="code" label="ISO code" placeholder="AED" required />
          <TextField form={form} name="name" label="Name" required />
          <TextField form={form} name="symbol" label="Symbol" required />
          <SelectField
            form={form}
            name="symbol_position"
            label="Symbol position"
            options={[
              { value: 'before', label: 'Before amount' },
              { value: 'after', label: 'After amount' },
            ]}
          />
          <NumberField form={form} name="decimal_places" label="Decimal places" min={0} max={4} step={1} />
          <NumberField form={form} name="exchange_rate" label="Exchange rate" min={0} step="any" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <SwitchField form={form} name="is_base" label="Base currency" description="Prices are stored in this currency." />
          <SwitchField form={form} name="is_active" label="Active" description="Available for checkout." />
        </FieldGrid>
      )}
    />
  );
}
