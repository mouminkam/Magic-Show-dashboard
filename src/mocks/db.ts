/**
 * The in-memory store behind the mock API.
 *
 * Reads are synchronous against a single object; writes go through `commit()`
 * which snapshots to localStorage. That gives the demo real persistence — a
 * created product survives a refresh — while keeping every screen honest about
 * asynchronous data access, because the service layer above is Promise-based.
 */

import { buildDatabase, SEED_VERSION, type MockDatabase } from './seed';

const STORAGE_KEY = 'magic-show.admin.db';

let db: MockDatabase = load();

function load(): MockDatabase {
  if (typeof window === 'undefined') return buildDatabase();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDatabase();
    const parsed = JSON.parse(raw) as Partial<MockDatabase>;
    // A seed bump invalidates the snapshot rather than half-migrating it.
    if (parsed.version !== SEED_VERSION) return buildDatabase();
    return parsed as MockDatabase;
  } catch {
    return buildDatabase();
  }
}

/** Persist the current snapshot. Quota failures are non-fatal by design. */
export function commit(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* Storage full or blocked — the session keeps working from memory. */
  }
}

export function getDb(): MockDatabase {
  return db;
}

/** Wipe the snapshot and regenerate from the seed. */
export function resetDb(): MockDatabase {
  db = buildDatabase();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  commit();
  return db;
}

/** Next id for a collection, mirroring an auto-increment primary key. */
export function nextId(rows: readonly { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export type { MockDatabase };
