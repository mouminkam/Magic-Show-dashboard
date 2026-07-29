/**
 * Single source of truth for write shapes.
 *
 * Forms validate against these with `zodResolver`, and the service layer types
 * its `create`/`update` inputs from the inferred types — so a field can never
 * drift between the form and the store.
 */

import { z } from 'zod';

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const optionalText = z.string().trim().default('');

/** Number coming out of an <input type="number">, which yields a string. */
const numeric = (label: string, opts: { min?: number; max?: number } = {}) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .refine((v) => !Number.isNaN(v), `${label} must be a number`)
    .refine((v) => (opts.min === undefined ? true : v >= opts.min), `${label} must be at least ${opts.min}`)
    .refine((v) => (opts.max === undefined ? true : v <= opts.max), `${label} must be at most ${opts.max}`);

const optionalNumber = z
  .union([z.literal(''), z.coerce.number()])
  .transform((v) => (v === '' || Number.isNaN(v) ? null : Number(v)));

/* ------------------------------------------------------------------ catalog */

export const categorySchema = z.object({
  name: required('Name'),
  slug: optionalText,
  description: optionalText,
  parent_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  is_active: z.boolean().default(true),
  meta_title: optionalText,
  meta_description: optionalText,
});
export type CategoryInput = z.input<typeof categorySchema>;
export type CategoryValues = z.output<typeof categorySchema>;

export const brandSchema = z.object({
  name: required('Name'),
  slug: optionalText,
  description: optionalText,
  website: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
  contact_email: z.union([z.literal(''), z.string().email('Enter a valid email')]).default(''),
  contact_phone: optionalText,
  country: optionalText,
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type BrandValues = z.output<typeof brandSchema>;

export const colorSchema = z.object({
  name: required('Name'),
  hex_code: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex value such as #1a1a1a'),
  family: required('Colour family'),
  is_active: z.boolean().default(true),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type ColorValues = z.output<typeof colorSchema>;

export const sizeSchema = z.object({
  name: required('Name'),
  scale: z.enum(['eu', 'uk', 'us', 'alpha']),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  is_active: z.boolean().default(true),
});
export type SizeValues = z.output<typeof sizeSchema>;

export const materialSchema = z.object({
  name: required('Name'),
  slug: optionalText,
  description: optionalText,
  category: required('Category'),
  is_active: z.boolean().default(true),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type MaterialValues = z.output<typeof materialSchema>;

export const seasonSchema = z.object({
  name: required('Name'),
  value: required('Code'),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  is_active: z.boolean().default(true),
});
export type SeasonValues = z.output<typeof seasonSchema>;

export const productAttributeSchema = z.object({
  name: required('Name'),
  slug: optionalText,
  description: optionalText,
  type: z.enum(['select', 'text', 'number', 'boolean', 'color']),
  is_required: z.boolean().default(false),
  is_filterable: z.boolean().default(true),
  is_visible: z.boolean().default(true),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  /** Comma-separated in the form, split on save. */
  options: optionalText,
});
export type ProductAttributeValues = z.output<typeof productAttributeSchema>;

export const productVariantSchema = z.object({
  id: z.number().optional(),
  sku: required('SKU'),
  color_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
  size_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
  price_delta: numeric('Price delta').default(0),
  quantity: numeric('Quantity', { min: 0 }).default(0),
  barcode: optionalText,
});

export const productSchema = z
  .object({
    name: required('Product name'),
    slug: optionalText,
    sku: required('SKU'),
    brand_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
    category_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
    material_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
    season_id: z.union([z.literal(''), z.coerce.number()]).transform((v) => (v === '' ? null : Number(v))),
    short_description: z.string().trim().max(220, 'Keep the summary under 220 characters').default(''),
    description: optionalText,
    price: numeric('Price', { min: 0 }),
    sale_price: optionalNumber,
    compare_price: optionalNumber,
    cost_price: numeric('Cost price', { min: 0 }).default(0),
    min_quantity: numeric('Low-stock threshold', { min: 0 }).default(5),
    weight: numeric('Weight', { min: 0 }).default(0),
    barcode: optionalText,
    model: optionalText,
    color_ids: z.array(z.number()).default([]),
    size_ids: z.array(z.number()).default([]),
    variants: z.array(productVariantSchema).default([]),
    attributes: z.record(z.string()).default({}),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    requires_shipping: z.boolean().default(true),
    track_quantity: z.boolean().default(true),
    allow_backorder: z.boolean().default(false),
    meta_title: optionalText,
    meta_description: optionalText,
    sort_order: numeric('Sort order', { min: 0 }).default(0),
  })
  .refine((v) => v.sale_price === null || v.sale_price < v.price, {
    message: 'Sale price must be below the regular price',
    path: ['sale_price'],
  });
export type ProductValues = z.output<typeof productSchema>;

export const reviewModerationSchema = z.object({
  is_approved: z.boolean(),
  is_featured: z.boolean(),
});
export type ReviewModerationValues = z.output<typeof reviewModerationSchema>;

/* ------------------------------------------------------------------- orders */

export const orderUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  tracking_number: optionalText,
  shipping_method: optionalText,
  admin_notes: optionalText,
});
export type OrderUpdateValues = z.output<typeof orderUpdateSchema>;

/* ---------------------------------------------------------------- customers */

export const customerSchema = z.object({
  first_name: required('First name'),
  last_name: required('Last name'),
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalText,
  gender: z.enum(['male', 'female', 'other']),
  date_of_birth: optionalText,
  address: optionalText,
  city: optionalText,
  state: optionalText,
  country: optionalText,
  postal_code: optionalText,
  preferred_language: z.enum(['en', 'ar']),
  preferred_currency: required('Currency'),
  is_active: z.boolean().default(true),
  email_verified: z.boolean().default(false),
  marketing_opt_in: z.boolean().default(false),
  notes: optionalText,
});
export type CustomerValues = z.output<typeof customerSchema>;

/* ---------------------------------------------------------------- inventory */

export const stockAdjustmentSchema = z.object({
  delta: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int('Enter a whole number')
    .refine((v) => v !== 0, 'Adjustment cannot be zero'),
  reason: z.enum(['restock', 'sale', 'damage', 'correction', 'transfer', 'return']),
  note: optionalText,
});
export type StockAdjustmentValues = z.output<typeof stockAdjustmentSchema>;

export const inventorySchema = z.object({
  product_id: numeric('Product'),
  location_type: z.enum(['warehouse', 'branch']),
  location_id: numeric('Location'),
  quantity: numeric('Quantity', { min: 0 }).default(0),
  reserved_quantity: numeric('Reserved', { min: 0 }).default(0),
  min_quantity: numeric('Reorder point', { min: 0 }).default(5),
  max_quantity: numeric('Maximum', { min: 0 }).default(100),
  cost_price: numeric('Cost price', { min: 0 }).default(0),
  rack_location: optionalText,
  shelf_location: optionalText,
  notes: optionalText,
  is_active: z.boolean().default(true),
});
export type InventoryValues = z.output<typeof inventorySchema>;

export const warehouseSchema = z.object({
  name: required('Name'),
  code: required('Code'),
  type: z.enum(['main', 'distribution', 'retail', 'storage']),
  address: optionalText,
  city: required('City'),
  country: required('Country'),
  phone: optionalText,
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]).default(''),
  manager_name: optionalText,
  capacity: numeric('Capacity', { min: 0 }).default(0),
  capacity_unit: optionalText,
  is_active: z.boolean().default(true),
});
export type WarehouseValues = z.output<typeof warehouseSchema>;

export const branchSchema = z.object({
  name: required('Name'),
  code: required('Code'),
  address: optionalText,
  city: required('City'),
  country: required('Country'),
  phone: optionalText,
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]).default(''),
  manager_name: optionalText,
  opening_time: optionalText,
  closing_time: optionalText,
  is_active: z.boolean().default(true),
});
export type BranchValues = z.output<typeof branchSchema>;

/* ---------------------------------------------------------------- marketing */

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, dashes and underscores only')
      .transform((v) => v.toUpperCase()),
    name: required('Name'),
    description: optionalText,
    type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
    value: numeric('Value', { min: 0 }),
    minimum_amount: numeric('Minimum basket', { min: 0 }).default(0),
    maximum_discount: optionalNumber,
    usage_limit: optionalNumber,
    usage_limit_per_customer: numeric('Per-customer limit', { min: 1 }).default(1),
    is_active: z.boolean().default(true),
    is_public: z.boolean().default(true),
    starts_at: required('Start date'),
    expires_at: optionalText,
    terms_and_conditions: optionalText,
  })
  .refine((v) => v.type !== 'percentage' || v.value <= 100, {
    message: 'A percentage discount cannot exceed 100',
    path: ['value'],
  })
  .refine((v) => !v.expires_at || !v.starts_at || v.expires_at >= v.starts_at, {
    message: 'Expiry must fall after the start date',
    path: ['expires_at'],
  });
export type CouponValues = z.output<typeof couponSchema>;

export const subscriberSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  name: optionalText,
  source: z.enum(['footer', 'checkout', 'popup', 'import']),
});
export type SubscriberValues = z.output<typeof subscriberSchema>;

export const testimonialSchema = z.object({
  customer_name: required('Customer name'),
  customer_role: optionalText,
  text: z.string().trim().min(20, 'Write at least 20 characters'),
  rating: numeric('Rating', { min: 1, max: 5 }).default(5),
  is_featured: z.boolean().default(false),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type TestimonialValues = z.output<typeof testimonialSchema>;

/* ------------------------------------------------------------------ content */

export const blogPostSchema = z.object({
  title: required('Title'),
  slug: optionalText,
  excerpt: z.string().trim().max(320, 'Keep the excerpt under 320 characters').default(''),
  content: z.string().trim().min(40, 'Write at least 40 characters'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  is_featured: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
  tags: optionalText,
  meta_title: optionalText,
  meta_description: optionalText,
  author_id: numeric('Author'),
  published_at: optionalText,
});
export type BlogPostValues = z.output<typeof blogPostSchema>;

export const teamMemberSchema = z.object({
  name: required('Name'),
  role: required('Role'),
  bio: optionalText,
  email: z.union([z.literal(''), z.string().email('Enter a valid email')]).default(''),
  phone: optionalText,
  linkedin: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
  instagram: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  is_active: z.boolean().default(true),
});
export type TeamMemberValues = z.output<typeof teamMemberSchema>;

export const homeSectionSchema = z.object({
  section_key: required('Section key'),
  title: required('Title'),
  subtitle: optionalText,
  description: optionalText,
  button_text: optionalText,
  button_link: optionalText,
  limit: numeric('Item limit', { min: 0 }).default(6),
  is_active: z.boolean().default(true),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type HomeSectionValues = z.output<typeof homeSectionSchema>;

export const aboutSectionSchema = z.object({
  section_key: required('Section key'),
  title: required('Title'),
  subtitle: optionalText,
  description: optionalText,
  button_text: optionalText,
  button_link: optionalText,
  features: optionalText,
  is_active: z.boolean().default(true),
});
export type AboutSectionValues = z.output<typeof aboutSectionSchema>;

export const aboutStatSchema = z.object({
  icon: required('Icon'),
  title: required('Label'),
  value: numeric('Value'),
  suffix: optionalText,
  sort_order: numeric('Sort order', { min: 0 }).default(0),
  is_active: z.boolean().default(true),
});
export type AboutStatValues = z.output<typeof aboutStatSchema>;

export const heroPageSchema = z.object({
  hero_title: required('Hero title'),
  hero_subtitle: optionalText,
  hero_left_badge: optionalText,
  hero_right_badge: optionalText,
});
export type HeroPageValues = z.output<typeof heroPageSchema>;

export const contactSettingSchema = z.object({
  hero_title: required('Hero title'),
  hero_subtitle: optionalText,
  details_title: optionalText,
  address: optionalText,
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalText,
  fax: optionalText,
  about_title: optionalText,
  about_text: optionalText,
  map_url: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
});
export type ContactSettingValues = z.output<typeof contactSettingSchema>;

/* ----------------------------------------------------------------- settings */

export const currencySchema = z.object({
  code: z
    .string()
    .trim()
    .length(3, 'Use the 3-letter ISO code')
    .transform((v) => v.toUpperCase()),
  name: required('Name'),
  symbol: required('Symbol'),
  symbol_position: z.enum(['before', 'after']),
  decimal_places: numeric('Decimal places', { min: 0, max: 4 }).default(2),
  exchange_rate: numeric('Exchange rate', { min: 0 }),
  is_base: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: numeric('Sort order', { min: 0 }).default(0),
});
export type CurrencyValues = z.output<typeof currencySchema>;

export const adminUserSchema = z.object({
  name: required('Name'),
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum([
    'super_admin',
    'store_manager',
    'product_manager',
    'analytics_team',
    'customer_service',
  ]),
  is_active: z.boolean().default(true),
  permission_ids: z.array(z.number()).default([]),
});
export type AdminUserValues = z.output<typeof adminUserSchema>;

export const storeSettingsSchema = z.object({
  store_name: required('Store name'),
  tagline: optionalText,
  support_email: z.string().trim().email('Enter a valid email'),
  support_phone: optionalText,
  default_currency: required('Default currency'),
  tax_rate: numeric('Tax rate', { min: 0, max: 100 }),
  free_shipping_threshold: numeric('Free shipping threshold', { min: 0 }),
  standard_shipping_fee: numeric('Standard shipping fee', { min: 0 }),
  low_stock_threshold: numeric('Low-stock threshold', { min: 0 }),
  orders_require_confirmation: z.boolean().default(true),
  guest_checkout_enabled: z.boolean().default(true),
  reviews_require_approval: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
  facebook_url: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
  instagram_url: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
  tiktok_url: z.union([z.literal(''), z.string().url('Enter a valid URL')]).default(''),
});
export type StoreSettingsValues = z.output<typeof storeSettingsSchema>;

/* --------------------------------------------------------------------- auth */

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().default(true),
});
export type LoginValues = z.output<typeof loginSchema>;
