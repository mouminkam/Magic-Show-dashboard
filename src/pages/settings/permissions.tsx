import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Tag } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect, MutedCell, PrimaryCell } from '@/components/data-table/cells';
import { useListControls } from '@/hooks/use-list-controls';
import { permissionsService } from '@/services/settings';
import { titleCase } from '@/lib/format';
import { errorMessage } from '@/lib/utils';
import type { Permission } from '@/types/domain';

const ACTION_TONE: Record<Permission['action'], 'brand' | 'positive' | 'caution' | 'critical' | 'info' | 'neutral'> = {
  read: 'info',
  create: 'positive',
  update: 'caution',
  delete: 'critical',
  manage: 'brand',
  export: 'neutral',
  approve: 'positive',
};

export default function PermissionsPage() {
  const controls = useListControls({ perPage: 15, sortBy: 'name', sortDir: 'asc' });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['permissions', 'list', controls.params],
    queryFn: () => permissionsService.list(controls.params),
    placeholderData: (previous) => previous,
  });

  const modulesQuery = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionsService.all(),
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => permissionsService.setActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission updated');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that permission')),
  });

  const moduleOptions = [
    { value: 'all', label: 'All modules' },
    ...[...new Set((modulesQuery.data ?? []).map((p) => p.module))].map((module) => ({
      value: module,
      label: titleCase(module),
    })),
  ];

  const columns = useCallback(
    (): ColumnDef<Permission, unknown>[] => [
      {
        id: 'display_name',
        header: 'Permission',
        meta: { sortKey: 'name', title: 'Permission' },
        cell: ({ row }) => (
          <PrimaryCell
            title={row.original.display_name}
            subtitle={row.original.name}
            badge={row.original.is_system ? <Badge tone="neutral">System</Badge> : undefined}
          />
        ),
      },
      {
        id: 'module',
        header: 'Module',
        meta: { sortKey: 'module', title: 'Module' },
        cell: ({ row }) => <Badge tone="neutral">{titleCase(row.original.module)}</Badge>,
      },
      {
        id: 'action',
        header: 'Action',
        meta: { sortKey: 'action', title: 'Action' },
        cell: ({ row }) => <Badge tone={ACTION_TONE[row.original.action]}>{titleCase(row.original.action)}</Badge>,
      },
      {
        id: 'description',
        header: 'Description',
        meta: { title: 'Description', cellClassName: 'max-w-[24rem]' },
        cell: ({ row }) => <MutedCell>{row.original.description}</MutedCell>,
      },
      {
        id: 'is_active',
        header: 'Enabled',
        meta: { align: 'end', title: 'Enabled' },
        cell: ({ row }) => (
          <span className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <Switch
              aria-label={`Toggle ${row.original.display_name}`}
              checked={row.original.is_active}
              disabled={row.original.is_system}
              onCheckedChange={(checked) =>
                toggleMutation.mutate({ id: row.original.id, isActive: checked })
              }
            />
          </span>
        ),
      },
    ],
    [toggleMutation],
  );

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Permissions"
        description="Every capability the console understands, grouped by module. System permissions cannot be disabled — they gate reads that other permissions depend on."
      />

      <DataTable
        label="Permissions"
        columns={columns()}
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
        searchPlaceholder="Search permissions…"
        filters={
          <FilterSelect
            label="Module"
            value={controls.filters.module ?? 'all'}
            onChange={(value) => controls.setFilter('module', value)}
            options={moduleOptions}
          />
        }
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        emptyIcon={<Tag size={18} />}
        emptyTitle="No permissions match"
        emptyDescription="Try clearing the module filter or search."
      />
    </div>
  );
}
