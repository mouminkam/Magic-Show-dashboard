/**
 * Factory for the many "flat resource" endpoints — taxonomies, settings tables,
 * team members and so on. They differ only in their collection, their search
 * fields and how form input maps onto a row, so the behaviour lives here once
 * and each resource becomes a few lines of configuration.
 */

import { getDb, nextId, nowIso, type MockDatabase } from '@/mocks/db';
import { notFound, respond, respondAndCommit, runQuery, type QueryConfig } from './core';
import type { ListParams, Paginated } from '@/types/api';

/** Keys of the database whose value is an array of `T`. */
type CollectionKeys<T> = {
  [K in keyof MockDatabase]: MockDatabase[K] extends T[] ? K : never;
}[keyof MockDatabase];

export interface CrudService<T, TInput> {
  list(params?: ListParams): Promise<Paginated<T>>;
  /** Every row, unpaginated — for select options and cross-references. */
  all(): Promise<T[]>;
  get(id: number): Promise<T>;
  create(input: TInput): Promise<T>;
  /** Full replace from validated form values. */
  update(id: number, input: TInput): Promise<T>;
  /** Field-level merge, for row toggles that bypass the form. */
  patch(id: number, changes: Partial<T>): Promise<T>;
  remove(id: number): Promise<{ id: number }>;
}

export interface CrudConfig<T extends { id: number }, TInput> {
  /** Human name used in error messages. */
  label: string;
  collection: CollectionKeys<T>;
  query: QueryConfig<T>;
  /** Build the stored row from validated form input. */
  fromInput: (input: TInput, existing: T | null, db: MockDatabase) => Omit<T, 'id'>;
  /** Optional guard run before delete; throw an ApiError to block. */
  beforeRemove?: (row: T, db: MockDatabase) => void;
  /** Ordering used by `all()` — defaults to stored order. */
  allSort?: (a: T, b: T) => number;
}

function stampCreate<T extends object>(row: T): T {
  if ('created_at' in row) (row as { created_at: string }).created_at = nowIso();
  if ('updated_at' in row) (row as { updated_at: string }).updated_at = nowIso();
  return row;
}

function stampUpdate<T extends object>(row: T): T {
  if ('updated_at' in row) (row as { updated_at: string }).updated_at = nowIso();
  return row;
}

export function createCrudService<T extends { id: number }, TInput>(
  config: CrudConfig<T, TInput>,
): CrudService<T, TInput> {
  const read = (): T[] => getDb()[config.collection] as unknown as T[];

  function requireIndex(rows: T[], id: number): number {
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) notFound(config.label, id);
    return index;
  }

  return {
    list(params: ListParams = {}) {
      return respond(runQuery(read(), params, config.query));
    },

    all() {
      const rows = [...read()];
      if (config.allSort) rows.sort(config.allSort);
      return respond(rows);
    },

    get(id: number) {
      const rows = read();
      return respond(rows[requireIndex(rows, id)]!);
    },

    create(input: TInput) {
      const rows = read();
      const row = stampCreate({ ...config.fromInput(input, null, getDb()), id: nextId(rows) }) as T;
      rows.unshift(row);
      return respondAndCommit(row);
    },

    update(id: number, input: TInput) {
      const rows = read();
      const index = requireIndex(rows, id);
      const existing = rows[index]!;
      const row = stampUpdate({
        ...existing,
        ...config.fromInput(input, existing, getDb()),
        id,
      }) as T;
      rows[index] = row;
      return respondAndCommit(row);
    },

    patch(id: number, changes: Partial<T>) {
      const rows = read();
      const index = requireIndex(rows, id);
      const row = stampUpdate({ ...rows[index]!, ...changes, id }) as T;
      rows[index] = row;
      return respondAndCommit(row);
    },

    remove(id: number) {
      const rows = read();
      const index = requireIndex(rows, id);
      config.beforeRemove?.(rows[index]!, getDb());
      rows.splice(index, 1);
      return respondAndCommit({ id });
    },
  };
}
