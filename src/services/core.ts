/**
 * Shared plumbing for the mock API.
 *
 * Every service call goes through `respond()`, which adds jitter so the UI has
 * to deal with real pending states, and `runQuery()`, which does the searching,
 * filtering, sorting and slicing *server-side* — screens only ever receive the
 * page they asked for, exactly as a paginated REST endpoint would behave.
 */

import { commit } from '@/mocks/db';
import { compareValues } from '@/lib/utils';
import { ApiError, type ListParams, type Paginated } from '@/types/api';

const MIN_LATENCY = 140;
const MAX_LATENCY = 420;

function jitter(): number {
  return MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
}

/** Resolve a value after simulated network latency. */
export function respond<T>(value: T, ms = jitter()): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

/** Resolve after latency, then persist — used by every mutation. */
export function respondAndCommit<T>(value: T): Promise<T> {
  commit();
  return respond(value);
}

export function notFound(entity: string, id: number | string): never {
  throw new ApiError(`${entity} #${id} was not found`, 404);
}

export type Accessor<T> = (row: T) => unknown;

export interface QueryConfig<T> {
  /** Fields concatenated into the free-text search haystack. */
  search?: Accessor<T>[];
  /** Named filters. The screen sends `filters: { status: 'shipped' }`. */
  filters?: Record<string, (row: T, value: string) => boolean>;
  /** Sort keys the endpoint understands. Unknown keys fall back to default. */
  sorters?: Record<string, Accessor<T>>;
  defaultSort?: { by: string; dir: 'asc' | 'desc' };
}

/**
 * Apply search -> filters -> sort -> pagination and return a page envelope.
 * `perPage: 0` returns every matching row (used by chart/aggregate callers).
 */
export function runQuery<T>(rows: readonly T[], params: ListParams, config: QueryConfig<T> = {}): Paginated<T> {
  let result = [...rows];

  const search = params.search?.trim().toLowerCase();
  if (search && config.search?.length) {
    result = result.filter((row) =>
      config.search!.some((accessor) => {
        const value = accessor(row);
        return value !== null && value !== undefined && String(value).toLowerCase().includes(search);
      }),
    );
  }

  if (params.filters) {
    for (const [key, rawValue] of Object.entries(params.filters)) {
      if (!rawValue || rawValue === 'all') continue;
      const predicate = config.filters?.[key];
      if (!predicate) continue;
      result = result.filter((row) => predicate(row, rawValue));
    }
  }

  const sortBy = params.sortBy ?? config.defaultSort?.by;
  const sortDir = params.sortDir ?? config.defaultSort?.dir ?? 'asc';
  const accessor = sortBy ? config.sorters?.[sortBy] : undefined;
  if (accessor) {
    const factor = sortDir === 'desc' ? -1 : 1;
    result.sort((a, b) => compareValues(accessor(a), accessor(b)) * factor);
  }

  const total = result.length;
  const perPage = params.perPage ?? 10;
  if (perPage <= 0) {
    return { rows: result, total, page: 1, perPage: total, totalPages: 1 };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(params.page ?? 1, 1), totalPages);
  const start = (page - 1) * perPage;

  return {
    rows: result.slice(start, start + perPage),
    total,
    page,
    perPage,
    totalPages,
  };
}

/** Empty page envelope — handy for optimistic placeholders. */
export function emptyPage<T>(perPage = 10): Paginated<T> {
  return { rows: [], total: 0, page: 1, perPage, totalPages: 1 };
}

export { ApiError };
