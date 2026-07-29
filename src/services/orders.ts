/** Order endpoints — list, detail, status transitions and note updates. */

import { getDb, nowIso } from '@/mocks/db';
import { ORDER_STATUS_TRANSITIONS } from '@/lib/status';
import { ApiError, notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type { Order, OrderListItem, OrderStatus, PaymentStatus } from '@/types/domain';
import type { OrderUpdateValues } from '@/lib/schemas';

function decorate(order: Order): OrderListItem {
  const customer = getDb().customers.find((c) => c.id === order.customer_id);
  return {
    ...order,
    customer_name: customer
      ? `${customer.first_name} ${customer.last_name}`
      : order.shipping_address.name,
    customer_email: customer?.email ?? '—',
    item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/** Timestamp column that a transition into `status` should stamp. */
function stampTransition(order: Order, status: OrderStatus): void {
  const now = nowIso();
  if (status === 'confirmed' && !order.confirmed_at) order.confirmed_at = now;
  if (status === 'shipped' && !order.shipped_at) order.shipped_at = now;
  if (status === 'delivered' && !order.delivered_at) order.delivered_at = now;
  if (status === 'cancelled') order.cancelled_at = now;
}

export const ordersService = {
  list(params: ListParams = {}): Promise<Paginated<OrderListItem>> {
    const rows = getDb().orders.map(decorate);
    return respond(
      runQuery(rows, params, {
        search: [
          (o) => o.order_number,
          (o) => o.customer_name,
          (o) => o.customer_email,
          (o) => o.tracking_number,
          (o) => o.items.map((i) => i.product_name).join(' '),
        ],
        filters: {
          status: (o, v) => o.status === v,
          payment_status: (o, v) => o.payment_status === v,
          payment_method: (o, v) => o.payment_method === v,
          customer_id: (o, v) => String(o.customer_id) === v,
          /** Rolling window in days, sent by the date-range control. */
          range: (o, v) => {
            const days = Number(v);
            if (!Number.isFinite(days)) return true;
            return Date.now() - new Date(o.created_at).getTime() <= days * 86_400_000;
          },
        },
        sorters: {
          order_number: (o) => o.order_number,
          created_at: (o) => o.created_at,
          total_amount: (o) => o.total_amount,
          customer_name: (o) => o.customer_name,
          status: (o) => o.status,
          item_count: (o) => o.item_count,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  get(id: number): Promise<OrderListItem> {
    const order = getDb().orders.find((o) => o.id === id);
    if (!order) notFound('Order', id);
    return respond(decorate(order));
  },

  /** Recent orders for the dashboard feed. */
  recent(limit = 6): Promise<OrderListItem[]> {
    const rows = getDb()
      .orders.map(decorate)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return respond(rows.slice(0, limit));
  },

  forCustomer(customerId: number): Promise<OrderListItem[]> {
    const rows = getDb()
      .orders.filter((o) => o.customer_id === customerId)
      .map(decorate)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return respond(rows);
  },

  /** Guarded status transition — rejects moves the workflow does not allow. */
  transition(id: number, status: OrderStatus): Promise<OrderListItem> {
    const order = getDb().orders.find((o) => o.id === id);
    if (!order) notFound('Order', id);
    const allowed = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(status)) {
      throw new ApiError(`An order cannot move from ${order.status} to ${status}`, 422);
    }
    order.status = status;
    stampTransition(order, status);
    if (status === 'delivered' && order.payment_status === 'pending') order.payment_status = 'paid';
    if (status === 'refunded') order.payment_status = 'refunded';
    order.updated_at = nowIso();
    return respondAndCommit(decorate(order));
  },

  setPaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<OrderListItem> {
    const order = getDb().orders.find((o) => o.id === id);
    if (!order) notFound('Order', id);
    order.payment_status = paymentStatus;
    order.updated_at = nowIso();
    return respondAndCommit(decorate(order));
  },

  update(id: number, input: OrderUpdateValues): Promise<OrderListItem> {
    const order = getDb().orders.find((o) => o.id === id);
    if (!order) notFound('Order', id);
    if (input.status !== order.status) {
      const allowed = ORDER_STATUS_TRANSITIONS[order.status];
      if (!allowed.includes(input.status)) {
        throw new ApiError(`An order cannot move from ${order.status} to ${input.status}`, 422);
      }
      stampTransition(order, input.status);
    }
    order.status = input.status;
    order.payment_status = input.payment_status;
    order.tracking_number = input.tracking_number;
    order.shipping_method = input.shipping_method;
    order.admin_notes = input.admin_notes;
    order.updated_at = nowIso();
    return respondAndCommit(decorate(order));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) notFound('Order', id);
    if (db.orders[index]!.status !== 'cancelled') {
      throw new ApiError('Only cancelled orders can be deleted', 409);
    }
    db.orders.splice(index, 1);
    return respondAndCommit({ id });
  },
};
