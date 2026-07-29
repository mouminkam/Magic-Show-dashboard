import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from './use-debounce';
import type { ListParams, SortDirection } from '@/types/api';

export interface ListControlsOptions {
  perPage?: number;
  sortBy?: string;
  sortDir?: SortDirection;
  filters?: Record<string, string>;
}

export interface ListControls {
  /** Ready to hand straight to a service `list()` call. */
  params: ListParams;
  page: number;
  perPage: number;
  search: string;
  sortBy: string | undefined;
  sortDir: SortDirection;
  filters: Record<string, string>;
  /** True while the debounced search is catching up with the input. */
  isSearching: boolean;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;
  toggleSort: (column: string) => void;
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  /** Count of non-default filters, for the "Clear" affordance. */
  activeFilterCount: number;
}

/**
 * Owns the query state for a list screen: pagination, debounced search,
 * sorting and named filters. Any change that narrows the result set resets the
 * page, which is the behaviour users expect and the one most tables get wrong.
 */
export function useListControls(options: ListControlsOptions = {}): ListControls {
  const initialFilters = options.filters ?? {};
  const [page, setPageRaw] = useState(1);
  const [perPage, setPerPageRaw] = useState(options.perPage ?? 10);
  const [search, setSearchRaw] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(options.sortBy);
  const [sortDir, setSortDir] = useState<SortDirection>(options.sortDir ?? 'desc');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  const debouncedSearch = useDebounce(search, 280);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    setPageRaw(1);
  }, []);

  const setPerPage = useCallback((value: number) => {
    setPerPageRaw(value);
    setPageRaw(1);
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageRaw(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchRaw('');
    setPageRaw(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSort = useCallback((column: string) => {
    setSortBy((currentColumn) => {
      if (currentColumn === column) {
        setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDir('asc');
      return column;
    });
    setPageRaw(1);
  }, []);

  const params = useMemo<ListParams>(
    () => ({
      page,
      perPage,
      search: debouncedSearch || undefined,
      sortBy,
      sortDir,
      filters,
    }),
    [page, perPage, debouncedSearch, sortBy, sortDir, filters],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => value && value !== 'all' && value !== initialFilters[key])
        .length + (debouncedSearch ? 1 : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, debouncedSearch],
  );

  return {
    params,
    page,
    perPage,
    search,
    sortBy,
    sortDir,
    filters,
    isSearching: search !== debouncedSearch,
    setPage: setPageRaw,
    setPerPage,
    setSearch,
    toggleSort,
    setFilter,
    resetFilters,
    activeFilterCount,
  };
}
