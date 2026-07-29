/** Inventory endpoints — stock per location, adjustments and the movement log. */

import { getDb, nextId, nowIso } from '@/mocks/db';
import { stockStatusFor } from './catalog';
import { ApiError, notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type { InventoryListItem, InventoryRow, StockMovement } from '@/types/domain';
import type { InventoryValues, StockAdjustmentValues } from '@/lib/schemas';

function locationName(row: InventoryRow): string {
  const db = getDb();
  if (row.location_type === 'warehouse') {
    return db.warehouses.find((w) => w.id === row.location_id)?.name ?? 'Unknown warehouse';
  }
  return db.branches.find((b) => b.id === row.location_id)?.name ?? 'Unknown branch';
}

function decorate(row: InventoryRow): InventoryListItem {
  const db = getDb();
  const product = db.products.find((p) => p.id === row.product_id);
  const available = Math.max(0, row.quantity - row.reserved_quantity);
  return {
    ...row,
    product_name: product?.name ?? 'Removed product',
    product_sku: product?.sku ?? '—',
    location_name: locationName(row),
    available_quantity: available,
    stock_status: stockStatusFor(available, row.min_quantity),
  };
}

/** Recompute a product's headline quantity from its inventory rows. */
function syncProductQuantity(productId: number): void {
  const db = getDb();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return;
  product.quantity = db.inventory
    .filter((r) => r.product_id === productId)
    .reduce((sum, r) => sum + Math.max(0, r.quantity - r.reserved_quantity), 0);
  product.updated_at = nowIso();
}

export const inventoryService = {
  list(params: ListParams = {}): Promise<Paginated<InventoryListItem>> {
    const rows = getDb().inventory.map(decorate);
    return respond(
      runQuery(rows, params, {
        search: [
          (r) => r.product_name,
          (r) => r.product_sku,
          (r) => r.location_name,
          (r) => r.rack_location,
        ],
        filters: {
          location_type: (r, v) => r.location_type === v,
          location: (r, v) => `${r.location_type}:${r.location_id}` === v,
          stock_status: (r, v) => r.stock_status === v,
          product_id: (r, v) => String(r.product_id) === v,
        },
        sorters: {
          product_name: (r) => r.product_name,
          location_name: (r) => r.location_name,
          quantity: (r) => r.quantity,
          available_quantity: (r) => r.available_quantity,
          reserved_quantity: (r) => r.reserved_quantity,
          min_quantity: (r) => r.min_quantity,
          updated_at: (r) => r.updated_at,
        },
        defaultSort: { by: 'available_quantity', dir: 'asc' },
      }),
    );
  },

  get(id: number): Promise<InventoryListItem> {
    const row = getDb().inventory.find((r) => r.id === id);
    if (!row) notFound('Inventory row', id);
    return respond(decorate(row));
  },

  /** Rows at or below their reorder point, worst first. */
  lowStock(limit = 0): Promise<InventoryListItem[]> {
    const rows = getDb()
      .inventory.map(decorate)
      .filter((r) => r.stock_status !== 'in_stock')
      .sort((a, b) => a.available_quantity - b.available_quantity);
    return respond(limit > 0 ? rows.slice(0, limit) : rows);
  },

  /** Totals per location for the inventory overview cards. */
  summary(): Promise<
    { key: string; name: string; type: string; units: number; value: number; lowStock: number }[]
  > {
    const db = getDb();
    const buckets = new Map<
      string,
      { key: string; name: string; type: string; units: number; value: number; lowStock: number }
    >();
    for (const row of db.inventory) {
      const key = `${row.location_type}:${row.location_id}`;
      const decorated = decorate(row);
      const bucket = buckets.get(key) ?? {
        key,
        name: decorated.location_name,
        type: row.location_type,
        units: 0,
        value: 0,
        lowStock: 0,
      };
      bucket.units += decorated.available_quantity;
      bucket.value += decorated.available_quantity * row.cost_price;
      if (decorated.stock_status !== 'in_stock') bucket.lowStock += 1;
      buckets.set(key, bucket);
    }
    return respond([...buckets.values()].sort((a, b) => b.units - a.units));
  },

  create(input: InventoryValues): Promise<InventoryListItem> {
    const db = getDb();
    const duplicate = db.inventory.find(
      (r) =>
        r.product_id === input.product_id &&
        r.location_type === input.location_type &&
        r.location_id === input.location_id,
    );
    if (duplicate) {
      throw new ApiError('That product already has a stock row at this location', 409);
    }
    const row: InventoryRow = {
      id: nextId(db.inventory),
      ...input,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.inventory.unshift(row);
    syncProductQuantity(row.product_id);
    return respondAndCommit(decorate(row));
  },

  update(id: number, input: InventoryValues): Promise<InventoryListItem> {
    const db = getDb();
    const index = db.inventory.findIndex((r) => r.id === id);
    if (index === -1) notFound('Inventory row', id);
    const row: InventoryRow = { ...db.inventory[index]!, ...input, id, updated_at: nowIso() };
    db.inventory[index] = row;
    syncProductQuantity(row.product_id);
    return respondAndCommit(decorate(row));
  },

  /** Apply a signed delta and append a movement record. */
  adjust(id: number, input: StockAdjustmentValues, actor: string): Promise<InventoryListItem> {
    const db = getDb();
    const row = db.inventory.find((r) => r.id === id);
    if (!row) notFound('Inventory row', id);
    const next = row.quantity + input.delta;
    if (next < 0) {
      throw new ApiError(
        `That would take stock to ${next}. Only ${row.quantity} units are on hand.`,
        422,
      );
    }
    row.quantity = next;
    row.updated_at = nowIso();

    const decorated = decorate(row);
    db.stockMovements.unshift({
      id: nextId(db.stockMovements),
      inventory_id: row.id,
      product_name: decorated.product_name,
      location_name: decorated.location_name,
      delta: input.delta,
      resulting_quantity: next,
      reason: input.reason,
      note: input.note,
      actor,
      created_at: nowIso(),
    });
    syncProductQuantity(row.product_id);
    return respondAndCommit(decorate(row));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.inventory.findIndex((r) => r.id === id);
    if (index === -1) notFound('Inventory row', id);
    const productId = db.inventory[index]!.product_id;
    db.inventory.splice(index, 1);
    syncProductQuantity(productId);
    return respondAndCommit({ id });
  },

  movements(params: ListParams = {}): Promise<Paginated<StockMovement>> {
    return respond(
      runQuery(getDb().stockMovements, params, {
        search: [(m) => m.product_name, (m) => m.location_name, (m) => m.actor, (m) => m.note],
        filters: {
          reason: (m, v) => m.reason === v,
          direction: (m, v) => (v === 'in' ? m.delta > 0 : m.delta < 0),
        },
        sorters: {
          created_at: (m) => m.created_at,
          delta: (m) => m.delta,
          product_name: (m) => m.product_name,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },
};
