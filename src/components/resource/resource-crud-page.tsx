import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import type { ZodType, ZodTypeDef } from 'zod';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { useListControls, type ListControls } from '@/hooks/use-list-controls';
import type { CrudHooks } from '@/hooks/use-crud';
import type { SortDirection } from '@/types/api';

export interface RowActionHandlers<T> {
  edit: (row: T) => void;
  remove: (row: T) => void;
}

export interface ResourceCrudPageProps<T extends { id: number }, TValues extends FieldValues> {
  title: string;
  description: string;
  /** Singular noun used in the create button, dialogs and confirmations. */
  entityLabel: string;
  hooks: CrudHooks<T, TValues>;
  /** The schema whose *output* is the form value shape. */
  schema: ZodType<TValues, ZodTypeDef, unknown>;
  /** Blank form state for the create dialog. */
  emptyValues: DefaultValues<TValues>;
  /** Map a stored row onto form state for the edit dialog. */
  toFormValues: (row: T) => DefaultValues<TValues>;
  columns: (actions: RowActionHandlers<T>) => ColumnDef<T, unknown>[];
  renderForm: (form: UseFormReturn<TValues>) => ReactNode;
  searchPlaceholder: string;
  filters?: (controls: ListControls) => ReactNode;
  initialFilters?: Record<string, string>;
  defaultSort?: string;
  defaultSortDir?: SortDirection;
  perPage?: number;
  dialogSize?: 'sm' | 'md' | 'lg' | 'xl';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  /** Extra content rendered between the header and the table. */
  children?: ReactNode;
  headerActions?: ReactNode;
}

/**
 * The shared list + create/edit/delete screen.
 *
 * Every flat resource in the console (taxonomies, locations, users, CMS
 * sections…) renders through this so they share pagination behaviour, empty
 * states, validation handling and confirmation copy. Screens with genuinely
 * different anatomy — products, orders, the inbox — are written by hand.
 */
export function ResourceCrudPage<T extends { id: number }, TValues extends FieldValues>({
  title,
  description,
  entityLabel,
  hooks,
  schema,
  emptyValues,
  toFormValues,
  columns,
  renderForm,
  searchPlaceholder,
  filters,
  initialFilters,
  defaultSort,
  defaultSortDir = 'asc',
  perPage = 10,
  dialogSize = 'md',
  emptyTitle,
  emptyDescription,
  emptyIcon,
  children,
  headerActions,
}: ResourceCrudPageProps<T, TValues>) {
  const controls = useListControls({
    perPage,
    sortBy: defaultSort,
    sortDir: defaultSortDir,
    filters: initialFilters,
  });

  const query = hooks.useList(controls.params);
  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const removeMutation = hooks.useRemove();

  const [editing, setEditing] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);

  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
    mode: 'onBlur',
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset(emptyValues);
    setDialogOpen(true);
  }, [form, emptyValues]);

  const openEdit = useCallback(
    (row: T) => {
      setEditing(row);
      form.reset(toFormValues(row));
      setDialogOpen(true);
    },
    [form, toFormValues],
  );

  const tableColumns = useMemo(
    () => columns({ edit: openEdit, remove: setPendingDelete }),
    [columns, openEdit],
  );

  const submitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
      // The mutation hook has already surfaced a toast; keep the dialog open
      // so the operator can correct the input rather than lose it.
    }
  });

  return (
    <div className="animate-in-up">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {headerActions}
            <Button icon={<Plus size={15} weight="bold" />} onClick={openCreate}>
              New {entityLabel.toLowerCase()}
            </Button>
          </>
        }
      />

      {children}

      <DataTable
        label={title}
        columns={tableColumns}
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
        searchPlaceholder={searchPlaceholder}
        filters={filters?.(controls)}
        activeFilterCount={controls.activeFilterCount}
        onClearFilters={controls.resetFilters}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle ?? `No ${title.toLowerCase()} yet`}
        emptyDescription={
          emptyDescription ??
          (controls.activeFilterCount > 0
            ? 'No records match the current filters. Try clearing them.'
            : `Create the first ${entityLabel.toLowerCase()} to get started.`)
        }
        emptyAction={
          controls.activeFilterCount > 0 ? (
            <Button variant="outline" size="sm" onClick={controls.resetFilters}>
              Clear filters
            </Button>
          ) : (
            <Button size="sm" icon={<Plus size={14} weight="bold" />} onClick={openCreate}>
              New {entityLabel.toLowerCase()}
            </Button>
          )
        }
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        size={dialogSize}
        title={editing ? `Edit ${entityLabel.toLowerCase()}` : `New ${entityLabel.toLowerCase()}`}
        description={
          editing
            ? 'Changes are applied to the demo store immediately.'
            : `Add a new ${entityLabel.toLowerCase()} to the demo store.`
        }
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(event);
        }}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Save changes' : `Create ${entityLabel.toLowerCase()}`}
            </Button>
          </>
        }
      >
        {renderForm(form)}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete this ${entityLabel.toLowerCase()}?`}
        message="This removes the record from the demo store. You can restore the original dataset at any time with “Reset demo data”."
        confirmLabel="Delete"
        busy={removeMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeMutation.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
            onError: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
}
