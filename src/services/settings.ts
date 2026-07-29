/** Currencies, locations, admin users & permissions, and the store settings. */

import { getDb, nowIso, resetDb } from '@/mocks/db';
import { createCrudService } from './crud';
import { ApiError, notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type { AdminUser, Branch, Currency, Permission, StoreSettings, Warehouse } from '@/types/domain';
import type {
  AdminUserValues,
  BranchValues,
  CurrencyValues,
  StoreSettingsValues,
  WarehouseValues,
} from '@/lib/schemas';

export const currenciesService = createCrudService<Currency, CurrencyValues>({
  label: 'Currency',
  collection: 'currencies',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(c) => c.code, (c) => c.name, (c) => c.symbol],
    filters: { is_active: (c, v) => String(c.is_active) === v },
    sorters: {
      code: (c) => c.code,
      name: (c) => c.name,
      exchange_rate: (c) => c.exchange_rate,
      sort_order: (c) => c.sort_order,
    },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input, existing, db) => {
    const clash = db.currencies.find((c) => c.code === input.code && c.id !== existing?.id);
    if (clash) throw new ApiError(`${input.code} already exists`, 409);
    // Only one base currency may exist; promoting one demotes the rest.
    if (input.is_base) {
      for (const currency of db.currencies) {
        if (currency.id !== existing?.id) currency.is_base = false;
      }
    }
    return {
      ...input,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
  },
  beforeRemove: (row) => {
    if (row.is_base) throw new ApiError('The base currency cannot be deleted', 409);
  },
});

export const warehousesService = createCrudService<Warehouse, WarehouseValues>({
  label: 'Warehouse',
  collection: 'warehouses',
  allSort: (a, b) => a.name.localeCompare(b.name),
  query: {
    search: [(w) => w.name, (w) => w.code, (w) => w.city, (w) => w.manager_name],
    filters: { is_active: (w, v) => String(w.is_active) === v, type: (w, v) => w.type === v },
    sorters: {
      name: (w) => w.name,
      code: (w) => w.code,
      city: (w) => w.city,
      capacity: (w) => w.capacity,
    },
    defaultSort: { by: 'name', dir: 'asc' },
  },
  fromInput: (input, existing) => ({
    ...input,
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  }),
  beforeRemove: (row, db) => {
    if (db.inventory.some((r) => r.location_type === 'warehouse' && r.location_id === row.id)) {
      throw new ApiError('Move the stock held at this warehouse first', 409);
    }
  },
});

export const branchesService = createCrudService<Branch, BranchValues>({
  label: 'Branch',
  collection: 'branches',
  allSort: (a, b) => a.name.localeCompare(b.name),
  query: {
    search: [(b) => b.name, (b) => b.code, (b) => b.city, (b) => b.manager_name],
    filters: { is_active: (b, v) => String(b.is_active) === v, city: (b, v) => b.city === v },
    sorters: { name: (b) => b.name, code: (b) => b.code, city: (b) => b.city },
    defaultSort: { by: 'name', dir: 'asc' },
  },
  fromInput: (input, existing) => ({
    ...input,
    working_days: existing?.working_days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  }),
  beforeRemove: (row, db) => {
    if (db.inventory.some((r) => r.location_type === 'branch' && r.location_id === row.id)) {
      throw new ApiError('Move the stock held at this branch first', 409);
    }
  },
});

export const adminUsersService = createCrudService<AdminUser, AdminUserValues>({
  label: 'User',
  collection: 'adminUsers',
  allSort: (a, b) => a.name.localeCompare(b.name),
  query: {
    search: [(u) => u.name, (u) => u.email, (u) => u.role],
    filters: { role: (u, v) => u.role === v, is_active: (u, v) => String(u.is_active) === v },
    sorters: {
      name: (u) => u.name,
      email: (u) => u.email,
      role: (u) => u.role,
      last_login_at: (u) => u.last_login_at,
      created_at: (u) => u.created_at,
    },
    defaultSort: { by: 'name', dir: 'asc' },
  },
  fromInput: (input, existing, db) => {
    const clash = db.adminUsers.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.id !== existing?.id,
    );
    if (clash) throw new ApiError(`${input.email} already has an account`, 409);
    return {
      name: input.name,
      email: input.email,
      role: input.role,
      is_active: input.is_active,
      permission_ids:
        input.role === 'super_admin' ? db.permissions.map((p) => p.id) : input.permission_ids,
      last_login_at: existing?.last_login_at ?? null,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
  },
  beforeRemove: (row, db) => {
    const remainingAdmins = db.adminUsers.filter(
      (u) => u.role === 'super_admin' && u.is_active && u.id !== row.id,
    );
    if (row.role === 'super_admin' && remainingAdmins.length === 0) {
      throw new ApiError('At least one active super admin must remain', 409);
    }
  },
});

export const permissionsService = {
  list(params: ListParams = {}): Promise<Paginated<Permission>> {
    return respond(
      runQuery(getDb().permissions, params, {
        search: [(p) => p.name, (p) => p.display_name, (p) => p.description],
        filters: { module: (p, v) => p.module === v, action: (p, v) => p.action === v },
        sorters: { name: (p) => p.name, module: (p) => p.module, action: (p) => p.action },
        defaultSort: { by: 'name', dir: 'asc' },
      }),
    );
  },

  all(): Promise<Permission[]> {
    return respond(getDb().permissions);
  },

  setActive(id: number, isActive: boolean): Promise<Permission> {
    const permission = getDb().permissions.find((p) => p.id === id);
    if (!permission) notFound('Permission', id);
    if (permission.is_system && !isActive) {
      throw new ApiError('System permissions cannot be disabled', 409);
    }
    permission.is_active = isActive;
    return respondAndCommit(permission);
  },
};

export const storeSettingsService = {
  get(): Promise<StoreSettings> {
    return respond(getDb().storeSettings);
  },
  update(input: StoreSettingsValues): Promise<StoreSettings> {
    const db = getDb();
    db.storeSettings = { ...db.storeSettings, ...input };
    return respondAndCommit(db.storeSettings);
  },
};

/** Demo-data controls surfaced in Settings and the user menu. */
export const demoDataService = {
  reset(): Promise<{ generated_at: string }> {
    const db = resetDb();
    return respond({ generated_at: db.generated_at }, 500);
  },
  stats(): Promise<{ label: string; count: number }[]> {
    const db = getDb();
    return respond([
      { label: 'Products', count: db.products.length },
      { label: 'Categories', count: db.categories.length },
      { label: 'Orders', count: db.orders.length },
      { label: 'Customers', count: db.customers.length },
      { label: 'Inventory rows', count: db.inventory.length },
      { label: 'Reviews', count: db.reviews.length },
      { label: 'Coupons', count: db.coupons.length },
      { label: 'Subscribers', count: db.subscribers.length },
      { label: 'Blog posts', count: db.blogPosts.length },
      { label: 'Comments', count: db.blogComments.length },
      { label: 'Messages', count: db.contactMessages.length },
      { label: 'Stock movements', count: db.stockMovements.length },
    ]);
  },
};
