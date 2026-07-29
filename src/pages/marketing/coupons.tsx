import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ChartLineUp, PencilSimple, Percent, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import {
  NumberField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge, type Tone } from '@/components/ui/badge';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { FilterSelect, MutedCell, RowActions } from '@/components/data-table/cells';
import { couponHooks } from '@/hooks/resources';
import { couponState, type CouponState } from '@/services/marketing';
import { couponSchema, type CouponValues } from '@/lib/schemas';
import { COUPON_TYPE_LABEL } from '@/lib/status';
import { formatDate, formatMoney, toDateInput } from '@/lib/format';
import type { Coupon } from '@/types/domain';

const STATE_TONE: Record<CouponState, Tone> = {
  active: 'positive',
  scheduled: 'info',
  expired: 'neutral',
  exhausted: 'caution',
  disabled: 'neutral',
};

const STATE_LABEL: Record<CouponState, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  exhausted: 'Fully redeemed',
  disabled: 'Disabled',
};

const EMPTY: CouponValues = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 10,
  minimum_amount: 0,
  maximum_discount: null,
  usage_limit: null,
  usage_limit_per_customer: 1,
  is_active: true,
  is_public: true,
  starts_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
  terms_and_conditions: '',
};

function describeValue(coupon: Coupon): string {
  if (coupon.type === 'free_shipping') return 'Free shipping';
  if (coupon.type === 'percentage') return `${coupon.value}% off`;
  return `${formatMoney(coupon.value)} off`;
}

export default function CouponsPage() {
  const navigate = useNavigate();

  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<Coupon>): ColumnDef<Coupon, unknown>[] => [
      {
        id: 'code',
        header: 'Coupon',
        meta: { sortKey: 'code', title: 'Coupon' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-ink ring-1 ring-inset ring-line">
                {row.original.code}
              </code>
              {!row.original.is_public ? <Badge tone="neutral">Private</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-[12px] text-muted">{row.original.name}</p>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Discount',
        meta: { title: 'Discount' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-ink">{describeValue(row.original)}</p>
            <p className="text-[12px] text-muted">{COUPON_TYPE_LABEL[row.original.type]}</p>
          </div>
        ),
      },
      {
        id: 'minimum_amount',
        header: 'Min basket',
        meta: { align: 'end', title: 'Min basket' },
        cell: ({ row }) => (
          <MutedCell>
            {row.original.minimum_amount > 0 ? formatMoney(row.original.minimum_amount) : 'None'}
          </MutedCell>
        ),
      },
      {
        id: 'used_count',
        header: 'Redeemed',
        meta: { sortKey: 'used_count', align: 'end', title: 'Redeemed' },
        cell: ({ row }) => (
          <span className="tnum text-ink">
            {row.original.used_count}
            {row.original.usage_limit !== null ? (
              <span className="text-faint"> / {row.original.usage_limit}</span>
            ) : null}
          </span>
        ),
      },
      {
        id: 'expires_at',
        header: 'Window',
        meta: { sortKey: 'expires_at', title: 'Window' },
        cell: ({ row }) => (
          <div className="min-w-0 text-[12.5px]">
            <p className="text-ink">{formatDate(row.original.starts_at)}</p>
            <p className="text-muted">
              {row.original.expires_at ? `to ${formatDate(row.original.expires_at)}` : 'No expiry'}
            </p>
          </div>
        ),
      },
      {
        id: 'state',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => {
          const state = couponState(row.original);
          return (
            <Badge tone={STATE_TONE[state]} dot>
              {STATE_LABEL[state]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem
              icon={<ChartLineUp size={15} />}
              onSelect={() => navigate(`/coupons/${row.original.id}`)}
            >
              Usage report
            </MenuItem>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit coupon
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [navigate],
  );

  return (
    <ResourceCrudPage<Coupon, CouponValues>
      title="Coupons"
      description="Discount codes for the storefront and branch tills. Open a coupon for its redemption report."
      entityLabel="Coupon"
      hooks={couponHooks}
      schema={couponSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        code: row.code,
        name: row.name,
        description: row.description,
        type: row.type,
        value: row.value,
        minimum_amount: row.minimum_amount,
        maximum_discount: row.maximum_discount,
        usage_limit: row.usage_limit,
        usage_limit_per_customer: row.usage_limit_per_customer,
        is_active: row.is_active,
        is_public: row.is_public,
        starts_at: toDateInput(row.starts_at),
        expires_at: toDateInput(row.expires_at),
        terms_and_conditions: row.terms_and_conditions,
      })}
      columns={columns}
      searchPlaceholder="Search by code, name or description…"
      defaultSort="starts_at"
      defaultSortDir="desc"
      dialogSize="lg"
      emptyIcon={<Percent size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Status"
            value={controls.filters.state ?? 'all'}
            onChange={(value) => controls.setFilter('state', value)}
            options={[
              { value: 'all', label: 'All coupons' },
              { value: 'active', label: 'Active' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'expired', label: 'Expired' },
              { value: 'exhausted', label: 'Fully redeemed' },
              { value: 'disabled', label: 'Disabled' },
            ]}
          />
          <FilterSelect
            label="Type"
            value={controls.filters.type ?? 'all'}
            onChange={(value) => controls.setFilter('type', value)}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed_amount', label: 'Fixed amount' },
              { value: 'free_shipping', label: 'Free shipping' },
            ]}
          />
        </>
      )}
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="code" label="Code" required placeholder="AW26LAUNCH" />
          <TextField form={form} name="name" label="Internal name" required placeholder="AW26 launch offer" />
          <SelectField
            form={form}
            name="type"
            label="Discount type"
            required
            options={[
              { value: 'percentage', label: 'Percentage off' },
              { value: 'fixed_amount', label: 'Fixed amount off' },
              { value: 'free_shipping', label: 'Free shipping' },
            ]}
          />
          <NumberField
            form={form}
            name="value"
            label="Value"
            min={0}
            required
            hint="Percent, or amount in AED. Ignored for free shipping."
          />
          <NumberField form={form} name="minimum_amount" label="Minimum basket" min={0} prefix="AED" />
          <NumberField
            form={form}
            name="maximum_discount"
            label="Maximum discount"
            min={0}
            prefix="AED"
            hint="Caps a percentage discount. Leave blank for no cap."
          />
          <NumberField
            form={form}
            name="usage_limit"
            label="Total redemptions"
            min={0}
            step={1}
            hint="Leave blank for unlimited"
          />
          <NumberField
            form={form}
            name="usage_limit_per_customer"
            label="Per customer"
            min={1}
            step={1}
          />
          <TextField form={form} name="starts_at" label="Starts" type="date" required />
          <TextField form={form} name="expires_at" label="Expires" type="date" />
          <FieldSpan>
            <TextareaField form={form} name="description" label="Description" rows={2} />
          </FieldSpan>
          <FieldSpan>
            <TextareaField
              form={form}
              name="terms_and_conditions"
              label="Terms & conditions"
              rows={3}
            />
          </FieldSpan>
          <SwitchField
            form={form}
            name="is_active"
            label="Active"
            description="Disabled coupons are rejected at checkout."
          />
          <SwitchField
            form={form}
            name="is_public"
            label="Publicly listed"
            description="Public codes appear on the offers page."
          />
        </FieldGrid>
      )}
    />
  );
}
