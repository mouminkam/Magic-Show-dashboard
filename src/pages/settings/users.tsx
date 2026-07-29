import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, ShieldCheck, TrashSimple } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { SelectField, SwitchField, TextField } from '@/components/resource/form-controls';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, PrimaryCell, RowActions, YES_NO_OPTIONS } from '@/components/data-table/cells';
import { adminUserHooks } from '@/hooks/resources';
import { permissionsService } from '@/services/settings';
import { adminUserSchema, type AdminUserValues } from '@/lib/schemas';
import { avatarImage } from '@/mocks/imagery';
import { formatRelative, titleCase } from '@/lib/format';
import { USER_ROLE_LABEL } from '@/lib/status';
import { USER_ROLES, type AdminUser, type Permission } from '@/types/domain';

const EMPTY: AdminUserValues = {
  name: '',
  email: '',
  role: 'customer_service',
  is_active: true,
  permission_ids: [],
};

export default function UsersPage() {
  const permissionsQuery = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionsService.all(),
    staleTime: 60_000,
  });

  const permissionsByModule = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissionsQuery.data ?? []) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }
    return [...groups.entries()];
  }, [permissionsQuery.data]);

  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<AdminUser>): ColumnDef<AdminUser, unknown>[] => [
      {
        id: 'name',
        header: 'User',
        meta: { sortKey: 'name', title: 'User' },
        cell: ({ row }) => (
          <PrimaryCell
            image={avatarImage(row.original.name)}
            imageRounded="full"
            title={row.original.name}
            subtitle={row.original.email}
          />
        ),
      },
      {
        id: 'role',
        header: 'Role',
        meta: { sortKey: 'role', title: 'Role' },
        cell: ({ row }) => <Badge tone="brand">{USER_ROLE_LABEL[row.original.role]}</Badge>,
      },
      {
        id: 'permission_ids',
        header: 'Permissions',
        meta: { title: 'Permissions' },
        cell: ({ row }) => (
          <span className="text-muted">{row.original.permission_ids.length} granted</span>
        ),
      },
      {
        id: 'last_login_at',
        header: 'Last login',
        meta: { sortKey: 'last_login_at', title: 'Last login' },
        cell: ({ row }) => <span className="text-muted">{formatRelative(row.original.last_login_at)}</span>,
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
              Edit user
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
    <ResourceCrudPage<AdminUser, AdminUserValues>
      title="Users"
      description="Admin console accounts. Super admins hold every permission automatically."
      entityLabel="User"
      hooks={adminUserHooks}
      schema={adminUserSchema}
      emptyValues={EMPTY}
      dialogSize="lg"
      toFormValues={(row) => ({
        name: row.name,
        email: row.email,
        role: row.role,
        is_active: row.is_active,
        permission_ids: row.permission_ids,
      })}
      columns={columns}
      searchPlaceholder="Search users…"
      defaultSort="name"
      emptyIcon={<ShieldCheck size={18} />}
      filters={(controls) => (
        <>
          <FilterSelect
            label="Role"
            value={controls.filters.role ?? 'all'}
            onChange={(value) => controls.setFilter('role', value)}
            options={[
              { value: 'all', label: 'All roles' },
              ...USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABEL[role] })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={controls.filters.is_active ?? 'all'}
            onChange={(value) => controls.setFilter('is_active', value)}
            options={YES_NO_OPTIONS}
          />
        </>
      )}
      renderForm={(form) => {
        const role = form.watch('role');
        const isSuperAdmin = role === 'super_admin';
        return (
          <FieldGrid>
            <TextField form={form} name="name" label="Name" required />
            <TextField form={form} name="email" label="Email" type="email" required />
            <SelectField
              form={form}
              name="role"
              label="Role"
              options={USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABEL[value] }))}
            />
            <FieldSpan>
              <SwitchField form={form} name="is_active" label="Active" description="Deactivated accounts cannot sign in." />
            </FieldSpan>

            <FieldSpan>
              <p className="mb-2 text-[12.5px] font-medium text-ink">
                Permissions
                {isSuperAdmin ? <span className="ms-1.5 font-normal text-muted">(all granted automatically)</span> : null}
              </p>
              {permissionsQuery.isLoading ? (
                <p className="text-[12.5px] text-muted">Loading permissions…</p>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-line bg-sunken/40 p-3">
                  {permissionsByModule.map(([module, permissions]) => (
                    <div key={module}>
                      <p className="mb-1.5 eyebrow">{titleCase(module)}</p>
                      <Controller
                        control={form.control}
                        name="permission_ids"
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            {permissions.map((permission) => {
                              const checked = isSuperAdmin || field.value.includes(permission.id);
                              return (
                                <label
                                  key={permission.id}
                                  className="flex items-center gap-1.5 text-[12.5px] text-muted"
                                >
                                  <Checkbox
                                    checked={checked}
                                    disabled={isSuperAdmin}
                                    onCheckedChange={(value) => {
                                      const next = new Set(field.value);
                                      if (value === true) next.add(permission.id);
                                      else next.delete(permission.id);
                                      field.onChange([...next]);
                                    }}
                                  />
                                  {titleCase(permission.action)}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </FieldSpan>
          </FieldGrid>
        );
      }}
    />
  );
}
