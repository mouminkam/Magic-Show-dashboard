/**
 * Aggregation endpoint for the overview screen.
 *
 * All maths happens here rather than in the component, mirroring how a real
 * `/admin/dashboard` endpoint would hand the client a ready-to-render payload.
 */

import { getDb } from '@/mocks/db';
import { stockStatusFor } from './catalog';
import { respond } from './core';
import { ORDER_STATUSES } from '@/types/domain';
import type {
  DashboardSummary,
  InventoryListItem,
  KpiDelta,
  Order,
  OrderListItem,
  OrderStatus,
} from '@/types/domain';

export type DashboardRange = 7 | 30 | 90 | 365;

/** Orders that count towards revenue — cancelled baskets never do. */
function isRevenue(order: Order): boolean {
  return order.status !== 'cancelled' && order.status !== 'refunded';
}

function delta(value: number, previous: number): KpiDelta {
  const change = previous === 0 ? (value === 0 ? 0 : 100) : ((value - previous) / previous) * 100;
  return { value, previous, change_pct: Math.round(change * 10) / 10 };
}

/** Bucket size that keeps the x-axis readable at each range. */
function bucketKey(date: Date, range: DashboardRange): string {
  if (range <= 30) return date.toISOString().slice(0, 10);
  if (range <= 90) {
    // Week-commencing (Monday) bucket.
    const d = new Date(date);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }
  return `${date.toISOString().slice(0, 7)}-01`;
}

function emptyBuckets(range: DashboardRange, now: number): Map<string, { revenue: number; orders: number }> {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const step = range <= 30 ? 1 : range <= 90 ? 7 : 30;
  for (let offset = range; offset >= 0; offset -= step) {
    const key = bucketKey(new Date(now - offset * 86_400_000), range);
    buckets.set(key, { revenue: 0, orders: 0 });
  }
  return buckets;
}

export const dashboardService = {
  summary(range: DashboardRange = 30): Promise<DashboardSummary> {
    const db = getDb();
    const now = Date.now();
    const windowMs = range * 86_400_000;
    const from = now - windowMs;
    const prevFrom = from - windowMs;

    const inWindow = db.orders.filter((o) => new Date(o.created_at).getTime() >= from);
    const inPrevious = db.orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= prevFrom && t < from;
    });

    const revenueOf = (orders: Order[]): number =>
      Math.round(orders.filter(isRevenue).reduce((s, o) => s + o.total_amount, 0) * 100) / 100;

    const revenue = revenueOf(inWindow);
    const prevRevenue = revenueOf(inPrevious);
    const orderCount = inWindow.filter(isRevenue).length;
    const prevOrderCount = inPrevious.filter(isRevenue).length;
    const aov = orderCount ? Math.round((revenue / orderCount) * 100) / 100 : 0;
    const prevAov = prevOrderCount ? Math.round((prevRevenue / prevOrderCount) * 100) / 100 : 0;

    const newCustomers = db.customers.filter(
      (c) => new Date(c.created_at).getTime() >= from,
    ).length;
    const prevNewCustomers = db.customers.filter((c) => {
      const t = new Date(c.created_at).getTime();
      return t >= prevFrom && t < from;
    }).length;

    /* ---------------------------------------------------------- time series */
    const buckets = emptyBuckets(range, now);
    for (const order of inWindow) {
      const key = bucketKey(new Date(order.created_at), range);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.orders += 1;
      if (isRevenue(order)) bucket.revenue += order.total_amount;
    }
    const revenue_series = [...buckets.entries()].map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders,
    }));

    /* ------------------------------------------------------ status breakdown */
    const status_breakdown = ORDER_STATUSES.map((status: OrderStatus) => {
      const rows = inWindow.filter((o) => o.status === status);
      return {
        status,
        count: rows.length,
        amount: Math.round(rows.reduce((s, o) => s + o.total_amount, 0) * 100) / 100,
      };
    }).filter((entry) => entry.count > 0);

    /* ---------------------------------------------------------- top products */
    const productTotals = new Map<number, { units: number; revenue: number }>();
    for (const order of inWindow) {
      if (!isRevenue(order)) continue;
      for (const item of order.items) {
        const entry = productTotals.get(item.product_id) ?? { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += item.total_price;
        productTotals.set(item.product_id, entry);
      }
    }
    const top_products = [...productTotals.entries()]
      .map(([product_id, totals]) => {
        const product = db.products.find((p) => p.id === product_id);
        return {
          product_id,
          name: product?.name ?? 'Removed product',
          sku: product?.sku ?? '—',
          image_url: product?.images[0]?.url ?? '',
          units: totals.units,
          revenue: Math.round(totals.revenue * 100) / 100,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    /* -------------------------------------------------------- category split */
    const categoryTotals = new Map<string, number>();
    for (const order of inWindow) {
      if (!isRevenue(order)) continue;
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.product_id);
        const category = db.categories.find((c) => c.id === product?.category_id);
        const name = category?.name ?? 'Uncategorised';
        categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + item.total_price);
      }
    }
    const category_split = [...categoryTotals.entries()]
      .map(([name, value]) => ({ name, revenue: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    /* --------------------------------------------------------- recent orders */
    const recent_orders: OrderListItem[] = [...db.orders]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6)
      .map((order) => {
        const customer = db.customers.find((c) => c.id === order.customer_id);
        return {
          ...order,
          customer_name: customer
            ? `${customer.first_name} ${customer.last_name}`
            : order.shipping_address.name,
          customer_email: customer?.email ?? '—',
          item_count: order.items.reduce((s, i) => s + i.quantity, 0),
        };
      });

    /* ------------------------------------------------------------- low stock */
    const low_stock: InventoryListItem[] = db.inventory
      .map((row) => {
        const product = db.products.find((p) => p.id === row.product_id);
        const available = Math.max(0, row.quantity - row.reserved_quantity);
        const location =
          row.location_type === 'warehouse'
            ? db.warehouses.find((w) => w.id === row.location_id)?.name
            : db.branches.find((b) => b.id === row.location_id)?.name;
        return {
          ...row,
          product_name: product?.name ?? 'Removed product',
          product_sku: product?.sku ?? '—',
          location_name: location ?? 'Unknown location',
          available_quantity: available,
          stock_status: stockStatusFor(available, row.min_quantity),
        };
      })
      .filter((row) => row.stock_status !== 'in_stock')
      .sort((a, b) => a.available_quantity - b.available_quantity)
      .slice(0, 6);

    return respond({
      revenue: delta(revenue, prevRevenue),
      orders: delta(orderCount, prevOrderCount),
      average_order_value: delta(aov, prevAov),
      new_customers: delta(newCustomers, prevNewCustomers),
      revenue_series,
      status_breakdown,
      top_products,
      category_split,
      recent_orders,
      low_stock,
      pending_actions: {
        unread_messages: db.contactMessages.filter((m) => m.status === 'new').length,
        pending_comments: db.blogComments.filter((c) => !c.is_approved).length,
        pending_reviews: db.reviews.filter((r) => !r.is_approved).length,
        orders_awaiting: db.orders.filter((o) => o.status === 'pending' || o.status === 'confirmed')
          .length,
      },
    });
  },
};
