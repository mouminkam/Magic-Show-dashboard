import { useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSimple, TrashSimple, UsersThree } from '@phosphor-icons/react';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { NumberField, SwitchField, TextField, TextareaField } from '@/components/resource/form-controls';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/components/ui/menu';
import { FilterSelect, MutedCell, PrimaryCell, RowActions, YES_NO_OPTIONS } from '@/components/data-table/cells';
import { teamHooks } from '@/hooks/resources';
import { teamMemberSchema, type TeamMemberValues } from '@/lib/schemas';
import { avatarImage } from '@/mocks/imagery';
import type { TeamMember } from '@/types/domain';

const EMPTY: TeamMemberValues = {
  name: '',
  role: '',
  bio: '',
  email: '',
  phone: '',
  linkedin: '',
  instagram: '',
  sort_order: 0,
  is_active: true,
};

export default function TeamPage() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<TeamMember>): ColumnDef<TeamMember, unknown>[] => [
      {
        id: 'name',
        header: 'Member',
        meta: { sortKey: 'name', title: 'Member' },
        cell: ({ row }) => (
          <PrimaryCell
            image={avatarImage(row.original.name)}
            imageRounded="full"
            title={row.original.name}
            subtitle={row.original.role}
            badge={!row.original.is_active ? <Badge tone="neutral">Hidden</Badge> : undefined}
          />
        ),
      },
      {
        id: 'email',
        header: 'Contact',
        meta: { title: 'Contact' },
        cell: ({ row }) => <MutedCell>{row.original.email || row.original.phone || '—'}</MutedCell>,
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
              Edit member
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
    <ResourceCrudPage<TeamMember, TeamMemberValues>
      title="Team"
      description="Staff profiles shown on the About page."
      entityLabel="Team member"
      hooks={teamHooks}
      schema={teamMemberSchema}
      emptyValues={EMPTY}
      toFormValues={(row) => ({
        name: row.name,
        role: row.role,
        bio: row.bio,
        email: row.email,
        phone: row.phone,
        linkedin: row.linkedin,
        instagram: row.instagram,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search team members…"
      defaultSort="sort_order"
      emptyIcon={<UsersThree size={18} />}
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
          <TextField form={form} name="role" label="Role" required />
          <TextField form={form} name="email" label="Email" type="email" />
          <TextField form={form} name="phone" label="Phone" />
          <TextField form={form} name="linkedin" label="LinkedIn URL" type="url" />
          <TextField form={form} name="instagram" label="Instagram URL" type="url" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <TextareaField form={form} name="bio" label="Bio" rows={3} />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Visible on the About page" />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}
