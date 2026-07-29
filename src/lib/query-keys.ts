import type { ListParams } from '@/types/api';

/**
 * Central query-key registry. Every cache entry is namespaced by resource so a
 * mutation can invalidate a whole resource with one call, and list keys carry
 * their params so pagination/sorting each get their own cache slot.
 */
export const qk = {
  dashboard: (range: number) => ['dashboard', range] as const,

  resource: (name: string) => [name] as const,
  list: (name: string, params: ListParams) => [name, 'list', params] as const,
  all: (name: string) => [name, 'all'] as const,
  detail: (name: string, id: number | string) => [name, 'detail', id] as const,

  orderList: (params: ListParams) => ['orders', 'list', params] as const,
  order: (id: number) => ['orders', 'detail', id] as const,
  customerOrders: (customerId: number) => ['orders', 'by-customer', customerId] as const,

  couponAnalytics: (id: number) => ['coupons', 'analytics', id] as const,
  inventorySummary: () => ['inventory', 'summary'] as const,
  lowStock: () => ['inventory', 'low-stock'] as const,
  stockMovements: (params: ListParams) => ['inventory', 'movements', params] as const,

  newsletterStats: () => ['subscribers', 'stats'] as const,
  messageCounts: () => ['messages', 'counts'] as const,
  blogTags: () => ['blog', 'tags'] as const,

  storeSettings: () => ['settings', 'store'] as const,
  contactSetting: () => ['settings', 'contact'] as const,
  heroPages: () => ['settings', 'hero-pages'] as const,
  demoStats: () => ['settings', 'demo-stats'] as const,
} as const;

/** Resource namespaces — used as the first key segment and for invalidation. */
export const RESOURCES = {
  products: 'products',
  categories: 'categories',
  brands: 'brands',
  colors: 'colors',
  sizes: 'sizes',
  materials: 'materials',
  seasons: 'seasons',
  attributes: 'attributes',
  reviews: 'reviews',
  orders: 'orders',
  customers: 'customers',
  inventory: 'inventory',
  coupons: 'coupons',
  couponUsages: 'coupon-usages',
  subscribers: 'subscribers',
  testimonials: 'testimonials',
  blogPosts: 'blog-posts',
  comments: 'comments',
  messages: 'messages',
  team: 'team',
  homeSections: 'home-sections',
  aboutSections: 'about-sections',
  aboutStats: 'about-stats',
  warehouses: 'warehouses',
  branches: 'branches',
  currencies: 'currencies',
  users: 'users',
  permissions: 'permissions',
} as const;

export type ResourceName = (typeof RESOURCES)[keyof typeof RESOURCES];
