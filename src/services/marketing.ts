/** Coupons (with usage analytics), newsletter list and testimonials. */

import { getDb, nowIso } from '@/mocks/db';
import { createCrudService } from './crud';
import { ApiError, notFound, respond, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type { Coupon, CouponUsage, NewsletterSubscriber, Testimonial } from '@/types/domain';
import type { CouponValues, SubscriberValues, TestimonialValues } from '@/lib/schemas';

/** Derived lifecycle state — expiry beats the `is_active` flag. */
export type CouponState = 'active' | 'scheduled' | 'expired' | 'exhausted' | 'disabled';

export function couponState(coupon: Coupon): CouponState {
  const now = Date.now();
  if (!coupon.is_active) return 'disabled';
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) return 'exhausted';
  if (new Date(coupon.starts_at).getTime() > now) return 'scheduled';
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return 'expired';
  return 'active';
}

export const couponsService = createCrudService<Coupon, CouponValues>({
  label: 'Coupon',
  collection: 'coupons',
  allSort: (a, b) => a.code.localeCompare(b.code),
  query: {
    search: [(c) => c.code, (c) => c.name, (c) => c.description],
    filters: {
      type: (c, v) => c.type === v,
      state: (c, v) => couponState(c) === v,
      is_public: (c, v) => String(c.is_public) === v,
    },
    sorters: {
      code: (c) => c.code,
      name: (c) => c.name,
      value: (c) => c.value,
      used_count: (c) => c.used_count,
      starts_at: (c) => c.starts_at,
      expires_at: (c) => c.expires_at,
    },
    defaultSort: { by: 'starts_at', dir: 'desc' },
  },
  fromInput: (input, existing, db) => {
    const clash = db.coupons.find((c) => c.code === input.code && c.id !== existing?.id);
    if (clash) throw new ApiError(`Code ${input.code} is already in use`, 409);
    return {
      code: input.code,
      name: input.name,
      description: input.description,
      type: input.type,
      value: input.type === 'free_shipping' ? 0 : input.value,
      minimum_amount: input.minimum_amount,
      maximum_discount: input.maximum_discount,
      usage_limit: input.usage_limit,
      usage_limit_per_customer: input.usage_limit_per_customer,
      used_count: existing?.used_count ?? 0,
      is_active: input.is_active,
      is_public: input.is_public,
      starts_at: new Date(input.starts_at).toISOString(),
      expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
      terms_and_conditions: input.terms_and_conditions,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
  },
});

export interface CouponAnalytics {
  coupon: Coupon;
  state: CouponState;
  usages: CouponUsage[];
  total_discount: number;
  total_revenue: number;
  unique_customers: number;
  /** Redemptions bucketed by month, oldest first. */
  timeline: { month: string; redemptions: number; discount: number }[];
}

export const couponAnalyticsService = {
  get(couponId: number): Promise<CouponAnalytics> {
    const db = getDb();
    const coupon = db.coupons.find((c) => c.id === couponId);
    if (!coupon) notFound('Coupon', couponId);
    const usages = db.couponUsages
      .filter((u) => u.coupon_id === couponId)
      .sort((a, b) => (a.used_at < b.used_at ? 1 : -1));

    const buckets = new Map<string, { redemptions: number; discount: number }>();
    for (const usage of usages) {
      const key = usage.used_at.slice(0, 7);
      const bucket = buckets.get(key) ?? { redemptions: 0, discount: 0 };
      bucket.redemptions += 1;
      bucket.discount += usage.discount_amount;
      buckets.set(key, bucket);
    }

    return respond({
      coupon,
      state: couponState(coupon),
      usages,
      total_discount: Math.round(usages.reduce((s, u) => s + u.discount_amount, 0) * 100) / 100,
      total_revenue: Math.round(usages.reduce((s, u) => s + u.order_total, 0) * 100) / 100,
      unique_customers: new Set(usages.map((u) => u.customer_id)).size,
      timeline: [...buckets.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, v]) => ({ month, ...v })),
    });
  },
};

export const subscribersService = createCrudService<NewsletterSubscriber, SubscriberValues>({
  label: 'Subscriber',
  collection: 'subscribers',
  query: {
    search: [(s) => s.email, (s) => s.name],
    filters: {
      source: (s, v) => s.source === v,
      state: (s, v) => (v === 'subscribed' ? s.unsubscribed_at === null : s.unsubscribed_at !== null),
    },
    sorters: {
      email: (s) => s.email,
      name: (s) => s.name,
      subscribed_at: (s) => s.subscribed_at,
      source: (s) => s.source,
    },
    defaultSort: { by: 'subscribed_at', dir: 'desc' },
  },
  fromInput: (input, existing, db) => {
    const clash = db.subscribers.find(
      (s) => s.email.toLowerCase() === input.email.toLowerCase() && s.id !== existing?.id,
    );
    if (clash) throw new ApiError(`${input.email} is already on the list`, 409);
    return {
      email: input.email,
      name: input.name,
      source: input.source,
      subscribed_at: existing?.subscribed_at ?? nowIso(),
      unsubscribed_at: existing?.unsubscribed_at ?? null,
    };
  },
});

export const testimonialsService = createCrudService<Testimonial, TestimonialValues>({
  label: 'Testimonial',
  collection: 'testimonials',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(t) => t.customer_name, (t) => t.text, (t) => t.customer_role],
    filters: {
      is_featured: (t, v) => String(t.is_featured) === v,
      rating: (t, v) => String(t.rating) === v,
    },
    sorters: {
      customer_name: (t) => t.customer_name,
      rating: (t) => t.rating,
      sort_order: (t) => t.sort_order,
      created_at: (t) => t.created_at,
    },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input, existing) => ({
    customer_name: input.customer_name,
    customer_role: input.customer_role,
    text: input.text,
    rating: input.rating,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  }),
});

/** Newsletter counters shown above the subscriber table. */
export const newsletterStatsService = {
  get(): Promise<{ total: number; subscribed: number; unsubscribed: number; last30: number }> {
    const rows = getDb().subscribers;
    const cutoff = Date.now() - 30 * 86_400_000;
    return respond({
      total: rows.length,
      subscribed: rows.filter((s) => s.unsubscribed_at === null).length,
      unsubscribed: rows.filter((s) => s.unsubscribed_at !== null).length,
      last30: rows.filter((s) => new Date(s.subscribed_at).getTime() >= cutoff).length,
    });
  },
};

/** Read-only usage feed across every coupon. */
export const couponUsageService = {
  list(params: ListParams = {}): Promise<Paginated<CouponUsage>> {
    return respond(
      runQuery(getDb().couponUsages, params, {
        search: [(u) => u.coupon_code, (u) => u.customer_name, (u) => u.order_number],
        filters: { coupon_id: (u, v) => String(u.coupon_id) === v },
        sorters: {
          used_at: (u) => u.used_at,
          discount_amount: (u) => u.discount_amount,
          order_total: (u) => u.order_total,
        },
        defaultSort: { by: 'used_at', dir: 'desc' },
      }),
    );
  },
};
