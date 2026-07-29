/** Customer endpoints. List rows carry lifetime-value aggregates. */

import { getDb, nextId, nowIso } from '@/mocks/db';
import { notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type { Customer, CustomerListItem } from '@/types/domain';
import type { CustomerValues } from '@/lib/schemas';

function decorate(customer: Customer): CustomerListItem {
  const orders = getDb().orders.filter(
    (o) => o.customer_id === customer.id && o.status !== 'cancelled',
  );
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const lastOrder = orders.reduce<string | null>(
    (latest, o) => (latest === null || o.created_at > latest ? o.created_at : latest),
    null,
  );
  return {
    ...customer,
    full_name: `${customer.first_name} ${customer.last_name}`,
    orders_count: orders.length,
    total_spent: Math.round(totalSpent * 100) / 100,
    last_order_at: lastOrder,
  };
}

export const customersService = {
  list(params: ListParams = {}): Promise<Paginated<CustomerListItem>> {
    const rows = getDb().customers.map(decorate);
    return respond(
      runQuery(rows, params, {
        search: [(c) => c.full_name, (c) => c.email, (c) => c.phone, (c) => c.city],
        filters: {
          is_active: (c, v) => String(c.is_active) === v,
          email_verified: (c, v) => String(c.email_verified) === v,
          country: (c, v) => c.country === v,
          marketing_opt_in: (c, v) => String(c.marketing_opt_in) === v,
          /** `repeat` = more than one completed order. */
          segment: (c, v) =>
            v === 'repeat' ? c.orders_count > 1 : v === 'new' ? c.orders_count <= 1 : true,
        },
        sorters: {
          full_name: (c) => c.full_name,
          email: (c) => c.email,
          orders_count: (c) => c.orders_count,
          total_spent: (c) => c.total_spent,
          created_at: (c) => c.created_at,
          last_order_at: (c) => c.last_order_at,
          city: (c) => c.city,
        },
        defaultSort: { by: 'total_spent', dir: 'desc' },
      }),
    );
  },

  get(id: number): Promise<CustomerListItem> {
    const customer = getDb().customers.find((c) => c.id === id);
    if (!customer) notFound('Customer', id);
    return respond(decorate(customer));
  },

  create(input: CustomerValues): Promise<CustomerListItem> {
    const db = getDb();
    const customer: Customer = {
      id: nextId(db.customers),
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      gender: input.gender,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      postal_code: input.postal_code,
      is_active: input.is_active,
      email_verified: input.email_verified,
      phone_verified: false,
      last_login_at: null,
      preferred_language: input.preferred_language,
      preferred_currency: input.preferred_currency,
      notes: input.notes,
      marketing_opt_in: input.marketing_opt_in,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.customers.unshift(customer);
    return respondAndCommit(decorate(customer));
  },

  update(id: number, input: CustomerValues): Promise<CustomerListItem> {
    const db = getDb();
    const index = db.customers.findIndex((c) => c.id === id);
    if (index === -1) notFound('Customer', id);
    const customer: Customer = {
      ...db.customers[index]!,
      ...input,
      id,
      updated_at: nowIso(),
    };
    db.customers[index] = customer;
    return respondAndCommit(decorate(customer));
  },

  patch(id: number, changes: Partial<Customer>): Promise<CustomerListItem> {
    const db = getDb();
    const index = db.customers.findIndex((c) => c.id === id);
    if (index === -1) notFound('Customer', id);
    const customer = { ...db.customers[index]!, ...changes, id, updated_at: nowIso() };
    db.customers[index] = customer;
    return respondAndCommit(decorate(customer));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.customers.findIndex((c) => c.id === id);
    if (index === -1) notFound('Customer', id);
    db.customers.splice(index, 1);
    return respondAndCommit({ id });
  },
};
