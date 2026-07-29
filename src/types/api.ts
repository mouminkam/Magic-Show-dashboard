/** Transport-shaped types. Identical to what a REST layer would return. */

export type SortDirection = 'asc' | 'desc';

export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDirection;
  /** Equality filters applied server-side. `all` / '' means "no filter". */
  filters?: Record<string, string | undefined>;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Error thrown by the mock service layer; mirrors an HTTP failure. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
