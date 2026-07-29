import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { qk } from '@/lib/query-keys';
import { errorMessage } from '@/lib/utils';
import type { CrudService } from '@/services/crud';
import type { ListParams, Paginated } from '@/types/api';

export interface CrudHookOptions {
  /** Singular noun used in toast copy, e.g. "Brand". */
  label: string;
  /** Extra query namespaces to invalidate — e.g. products after a category edit. */
  alsoInvalidate?: string[];
}

export interface CrudHooks<T, TInput> {
  useList: (params: ListParams) => ReturnType<typeof useQuery<Paginated<T>>>;
  useAll: () => ReturnType<typeof useQuery<T[]>>;
  useCreate: () => UseMutationResult<T, Error, TInput>;
  useUpdate: () => UseMutationResult<T, Error, { id: number; input: TInput }>;
  usePatch: () => UseMutationResult<T, Error, { id: number; changes: Partial<T> }>;
  useRemove: () => UseMutationResult<{ id: number }, Error, number>;
}

/**
 * Binds a `CrudService` to TanStack Query: list/all reads plus mutations that
 * invalidate the resource namespace and raise a toast. Screens get consistent
 * feedback without repeating the same six mutation blocks everywhere.
 */
export function createCrudHooks<T extends { id: number }, TInput>(
  resource: string,
  service: CrudService<T, TInput>,
  options: CrudHookOptions,
): CrudHooks<T, TInput> {
  function useInvalidate(): () => void {
    const client = useQueryClient();
    return () => {
      void client.invalidateQueries({ queryKey: qk.resource(resource) });
      for (const extra of options.alsoInvalidate ?? []) {
        void client.invalidateQueries({ queryKey: qk.resource(extra) });
      }
      void client.invalidateQueries({ queryKey: ['dashboard'] });
    };
  }

  return {
    useList(params: ListParams) {
      return useQuery({
        queryKey: qk.list(resource, params),
        queryFn: () => service.list(params),
        placeholderData: (previous) => previous,
      });
    },

    useAll() {
      return useQuery({
        queryKey: qk.all(resource),
        queryFn: () => service.all(),
        staleTime: 60_000,
      });
    },

    useCreate() {
      const invalidate = useInvalidate();
      return useMutation<T, Error, TInput>({
        mutationFn: (input) => service.create(input),
        onSuccess: () => {
          invalidate();
          toast.success(`${options.label} created`);
        },
        onError: (error) => toast.error(errorMessage(error, `Could not create the ${options.label.toLowerCase()}`)),
      });
    },

    useUpdate() {
      const invalidate = useInvalidate();
      return useMutation<T, Error, { id: number; input: TInput }>({
        mutationFn: ({ id, input }) => service.update(id, input),
        onSuccess: () => {
          invalidate();
          toast.success(`${options.label} updated`);
        },
        onError: (error) => toast.error(errorMessage(error, `Could not update the ${options.label.toLowerCase()}`)),
      });
    },

    usePatch() {
      const invalidate = useInvalidate();
      return useMutation<T, Error, { id: number; changes: Partial<T> }>({
        mutationFn: ({ id, changes }) => service.patch(id, changes),
        onSuccess: () => invalidate(),
        onError: (error) => toast.error(errorMessage(error, 'Could not save that change')),
      });
    },

    useRemove() {
      const invalidate = useInvalidate();
      return useMutation<{ id: number }, Error, number>({
        mutationFn: (id) => service.remove(id),
        onSuccess: () => {
          invalidate();
          toast.success(`${options.label} deleted`);
        },
        onError: (error) => toast.error(errorMessage(error, `Could not delete the ${options.label.toLowerCase()}`)),
      });
    },
  };
}
