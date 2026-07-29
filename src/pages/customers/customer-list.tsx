import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, PencilSimple, Plus, TrashSimple, UsersThree } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { MenuItem, MenuSeparator } from '@/components/ui/menu';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MoneyCell, MutedCell, PrimaryCell, RowActions } from '@/components/data-table/cells';
import {
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { useListControls } from '@/hooks/use-list-controls';
import { customersService } from '@/services/customers';
import { qk } from '@/lib/query-keys';
import { customerSchema, type CustomerValues } from '@/lib/schemas';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import { errorMessage } from '@/lib/utils';
import { CITIES } from '@/mocks/content';
import type { CustomerListItem } from '@/types/domain';

const EMPTY: CustomerValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: 'female',
  date_of_birth: '',
  address: '',
  city: '',
  state: '',
  country: 'United Arab Emirates',
  postal_code: '',
  preferred_language: 'en',
  preferred_currency: 'AED',
  is_active: true,
  email_verified: false,
  marketing_opt_in: false,
  notes: '',
};

const COUNTRIES = [...new Set(CITIES.map(([, , country]) => country))];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const controls = useListControls({ perPage: 10, sortBy: 'total_spent', sortDir: 'desc' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerListItem | null>(null);

  const query = useQuery({
    queryKey: qk.list('customers', controls.params),
    queryFn: () => customersService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('customers') });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  });

  const createMutation = useMutation({
    mutationFn: (values: CustomerValues) => customersService.create(values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast.success('Customer created');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create that customer')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CustomerValues }) =>
      customersService.update(id, values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      toast.success('Customer updated');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that customer')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => customersService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Customer deleted');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete that customer')),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (customer: CustomerListItem) => {
    setEditing(customer);
    form.reset({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      gender: customer.gender,
      date_of_birth: customer.date_of_birth,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postal_code: customer.postal_code,
      preferred_language: customer.preferred_language,
      preferred_currency: customer.preferred_currency,
      is_active: customer.is_active,
      email_verified: customer.email_verified,
      marketing_opt_in: customer.marketing_opt_in,
      notes: customer.notes,
    });
    setDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<CustomerListItem, unknown>[]>(
    () => [
      {
        id: 'full_name',
        header: 'Customer',
        meta: { sortKey: 'full_name', title: 'Customer' },
        cell: ({ row }) => (
          <PrimaryCell
            image={null}
            imageRounded="full"
            title={row.original.full_name}
            subtitle={row.original.email}
            badge={
              row.original.orders_count > 3 ? <Badge tone="brand">VIP</Badge> : undefined
            }
          />
        ),
      },
      {
        id: 'city',
        header: 'Location',
        meta: { sortKey: 'city', title: 'Location' },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.city || '—'}</p>
            <p className="truncate text-[12px] text-muted">{row.original.country}</p>
          </div>
        ),
      },
      {
        id: 'orders_count',
        header: 'Orders',
        meta: { sortKey: 'orders_count', align: 'end', title: 'Orders' },
        cell: ({ row }) => <span className="tnum text-ink">{row.original.orders_count}</span>,
      },
      {
        id: 'total_spent',
        header: 'Lifetime value',
        meta: { sortKey: 'total_spent', align: 'end', title: 'Lifetime value' },
        cell: ({ row }) => <MoneyCell>{formatMoney(row.original.total_spent)}</MoneyCell>,
      },
      {
        id: 'last_order_at',
        header: 'Last order',
        meta: { sortKey: 'last_order_at', title: 'Last order' },
        cell: ({ row }) => (
          <MutedCell>
            {row.original.last_order_at ? formatRelative(row.original.last_order_at) : 'Never'}
          </MutedCell>
        ),
      },
      {
        id: 'created_at',
        header: 'Joined',
        meta: { sortKey: 'created_at', title: 'Joined' },
        cell: ({ row }) => <MutedCell>{formatDate(row.original.created_at)}</MutedCell>,
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge tone={row.original.is_active ? 'positive' : 'neutral'} dot>
              {row.original.is_active ? 'Active' : 'Disabled'}
            </Badge>
            {row.original.marketing_opt_in ? <Badge tone="info">Opted in</Badge> : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<Eye size={15} />} onSelect={() => navigate(`/customers/${row.original.id}`)}>
              View profile
            </MenuItem>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => openEdit(row.original)}>
              Edit details
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={<TrashSimple size={15} />}
              destructive
              onSelect={() => setPendingDelete(row.original)}
            >
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    // openEdit is stable enough for this screen; navigate is the only external dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate],
  );

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Customers"
        description="Everyone who has shopped with Magic Show, ranked by lifetime value."
        actions={
          <Button icon={<Plus size={15} weight="bold" />} onClick={openCreate}>
            New customer
          </Button>
        }
      />

      <DataTable
        label="Customers"
        columns={columns}
        data={query.data?.rows ?? []}
        total={query.data?.total ?? 0}
        page={query.data?.page ?? controls.page}
        perPage={controls.perPage}
        totalPages={query.data?.totalPages ?? 1}
        onPageChange={controls.setPage}
        onPerPageChange={controls.setPerPage}
        sortBy={controls.sortBy}
        sortDir={controls.sortDir}
        onSortChange={controls.toggleSort}
        loading={query.isLoading}
        fetching={query.isFetching && !query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        search={controls.search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search by name, email, phone or city…"
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyIcon={<UsersThree size={18} />}
        emptyTitle="No customers match"
        emptyDescription="Adjust the filters or add a customer manually."
        filters={
          <>
            <FilterSelect
              label="Segment"
              value={controls.filters.segment ?? 'all'}
              onChange={(value) => controls.setFilter('segment', value)}
              options={[
                { value: 'all', label: 'All customers' },
                { value: 'repeat', label: 'Repeat buyers' },
                { value: 'new', label: 'One order or fewer' },
              ]}
            />
            <FilterSelect
              label="Country"
              value={controls.filters.country ?? 'all'}
              onChange={(value) => controls.setFilter('country', value)}
              options={[
                { value: 'all', label: 'All countries' },
                ...COUNTRIES.map((country) => ({ value: country, label: country })),
              ]}
            />
            <FilterSelect
              label="Marketing"
              value={controls.filters.marketing_opt_in ?? 'all'}
              onChange={(value) => controls.setFilter('marketing_opt_in', value)}
              options={[
                { value: 'all', label: 'Any consent' },
                { value: 'true', label: 'Opted in' },
                { value: 'false', label: 'Not opted in' },
              ]}
            />
          </>
        }
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        size="lg"
        title={editing ? 'Edit customer' : 'New customer'}
        description="Customer records are used for order history, marketing consent and support."
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit((values) => {
            if (editing) updateMutation.mutate({ id: editing.id, values });
            else createMutation.mutate(values);
          })(event);
        }}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Save changes' : 'Create customer'}
            </Button>
          </>
        }
      >
        <FieldGrid>
          <TextField form={form} name="first_name" label="First name" required />
          <TextField form={form} name="last_name" label="Last name" required />
          <TextField form={form} name="email" label="Email" type="email" required />
          <TextField form={form} name="phone" label="Phone" />
          <SelectField
            form={form}
            name="gender"
            label="Gender"
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <TextField form={form} name="date_of_birth" label="Date of birth" type="date" />
          <FieldSpan>
            <TextField form={form} name="address" label="Address" />
          </FieldSpan>
          <TextField form={form} name="city" label="City" />
          <TextField form={form} name="state" label="Emirate / State" />
          <TextField form={form} name="country" label="Country" />
          <TextField form={form} name="postal_code" label="Postal code" />
          <SelectField
            form={form}
            name="preferred_language"
            label="Preferred language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'Arabic' },
            ]}
          />
          <SelectField
            form={form}
            name="preferred_currency"
            label="Preferred currency"
            options={[
              { value: 'AED', label: 'AED' },
              { value: 'SAR', label: 'SAR' },
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
            ]}
          />
          <FieldSpan>
            <TextareaField form={form} name="notes" label="Internal notes" rows={2} />
          </FieldSpan>
          <SwitchField form={form} name="is_active" label="Account active" />
          <SwitchField form={form} name="email_verified" label="Email verified" />
          <FieldSpan>
            <SwitchField
              form={form}
              name="marketing_opt_in"
              label="Marketing consent"
              description="Required before this customer can be added to a campaign."
            />
          </FieldSpan>
        </FieldGrid>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.full_name ?? 'this customer'}?`}
        message="The customer record is removed. Their historic orders stay in the system for reporting."
        confirmLabel="Delete customer"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
