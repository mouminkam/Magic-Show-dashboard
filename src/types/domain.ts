/**
 * Domain model for the Magic Show storefront, mirrored from the Laravel schema
 * this console replaces (app/Models/*). Names and shapes intentionally track
 * the backend so a real API can be swapped in behind the service layer without
 * touching a single screen.
 */

export type ID = number;

/** ISO-8601 timestamp string. */
export type Timestamp = string;

export interface Auditable {
  created_at: Timestamp;
  updated_at: Timestamp;
}

/* ------------------------------------------------------------------ catalog */

export interface Category extends Auditable {
  id: ID;
  name: string;
  slug: string;
  description: string;
  parent_id: ID | null;
  sort_order: number;
  is_active: boolean;
  meta_title: string;
  meta_description: string;
}

export interface Brand extends Auditable {
  id: ID;
  name: string;
  slug: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  country: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface Color extends Auditable {
  id: ID;
  name: string;
  hex_code: string;
  family: string;
  is_active: boolean;
  sort_order: number;
}

export interface Size extends Auditable {
  id: ID;
  name: string;
  scale: 'eu' | 'uk' | 'us' | 'alpha';
  sort_order: number;
  is_active: boolean;
}

export interface Material extends Auditable {
  id: ID;
  name: string;
  slug: string;
  description: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

export interface Season extends Auditable {
  id: ID;
  name: string;
  value: string;
  sort_order: number;
  is_active: boolean;
}

export type AttributeType = 'select' | 'text' | 'number' | 'boolean' | 'color';

export interface ProductAttribute extends Auditable {
  id: ID;
  name: string;
  slug: string;
  description: string;
  type: AttributeType;
  is_required: boolean;
  is_filterable: boolean;
  is_visible: boolean;
  sort_order: number;
  options: string[];
}

export interface ProductImage {
  id: ID;
  url: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface ProductVariant {
  id: ID;
  sku: string;
  color_id: ID | null;
  size_id: ID | null;
  price_delta: number;
  quantity: number;
  barcode: string;
}

export interface Product extends Auditable {
  id: ID;
  name: string;
  slug: string;
  sku: string;
  brand_id: ID | null;
  category_id: ID | null;
  material_id: ID | null;
  season_id: ID | null;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | null;
  compare_price: number | null;
  cost_price: number;
  quantity: number;
  min_quantity: number;
  weight: number;
  barcode: string;
  model: string;
  images: ProductImage[];
  variants: ProductVariant[];
  color_ids: ID[];
  size_ids: ID[];
  attributes: Record<string, string>;
  is_active: boolean;
  is_featured: boolean;
  requires_shipping: boolean;
  track_quantity: boolean;
  allow_backorder: boolean;
  meta_title: string;
  meta_description: string;
  sort_order: number;
  published_at: Timestamp | null;
  rating: number;
  review_count: number;
  units_sold: number;
}

/** Product joined with the label fields every list screen needs. */
export interface ProductListItem extends Product {
  brand_name: string;
  category_name: string;
  stock_status: StockStatus;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/* ------------------------------------------------------------------- orders */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface OrderItem {
  id: ID;
  product_id: ID;
  product_name: string;
  product_sku: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  image_url: string;
}

export interface Order extends Auditable {
  id: ID;
  order_number: string;
  customer_id: ID;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'card' | 'cash_on_delivery' | 'bank_transfer' | 'wallet';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  shipping_method: string;
  customer_notes: string;
  admin_notes: string;
  tracking_number: string;
  coupon_code: string | null;
  confirmed_at: Timestamp | null;
  shipped_at: Timestamp | null;
  delivered_at: Timestamp | null;
  cancelled_at: Timestamp | null;
  items: OrderItem[];
}

/** Order joined with denormalised customer labels for list views. */
export interface OrderListItem extends Order {
  customer_name: string;
  customer_email: string;
  item_count: number;
}

/* ---------------------------------------------------------------- customers */

export interface Customer extends Auditable {
  id: ID;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at: Timestamp | null;
  preferred_language: 'en' | 'ar';
  preferred_currency: string;
  notes: string;
  marketing_opt_in: boolean;
}

export interface CustomerListItem extends Customer {
  full_name: string;
  orders_count: number;
  total_spent: number;
  last_order_at: Timestamp | null;
}

/* ---------------------------------------------------------------- inventory */

export type LocationType = 'warehouse' | 'branch';

export interface Warehouse extends Auditable {
  id: ID;
  name: string;
  code: string;
  type: 'main' | 'distribution' | 'retail' | 'storage';
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  manager_name: string;
  capacity: number;
  capacity_unit: string;
  is_active: boolean;
}

export interface Branch extends Auditable {
  id: ID;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  manager_name: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  is_active: boolean;
}

export interface InventoryRow extends Auditable {
  id: ID;
  product_id: ID;
  location_type: LocationType;
  location_id: ID;
  quantity: number;
  reserved_quantity: number;
  min_quantity: number;
  max_quantity: number;
  cost_price: number;
  rack_location: string;
  shelf_location: string;
  notes: string;
  is_active: boolean;
}

export interface InventoryListItem extends InventoryRow {
  product_name: string;
  product_sku: string;
  location_name: string;
  available_quantity: number;
  stock_status: StockStatus;
}

export interface StockMovement {
  id: ID;
  inventory_id: ID;
  product_name: string;
  location_name: string;
  delta: number;
  resulting_quantity: number;
  reason: 'restock' | 'sale' | 'damage' | 'correction' | 'transfer' | 'return';
  note: string;
  actor: string;
  created_at: Timestamp;
}

/* ---------------------------------------------------------------- marketing */

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Coupon extends Auditable {
  id: ID;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minimum_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
  starts_at: Timestamp;
  expires_at: Timestamp | null;
  terms_and_conditions: string;
}

export interface CouponUsage {
  id: ID;
  coupon_id: ID;
  coupon_code: string;
  customer_id: ID;
  customer_name: string;
  order_id: ID;
  order_number: string;
  discount_amount: number;
  order_total: number;
  used_at: Timestamp;
}

export interface NewsletterSubscriber {
  id: ID;
  email: string;
  name: string;
  source: 'footer' | 'checkout' | 'popup' | 'import';
  subscribed_at: Timestamp;
  unsubscribed_at: Timestamp | null;
}

export interface Testimonial extends Auditable {
  id: ID;
  customer_name: string;
  customer_role: string;
  text: string;
  rating: number;
  is_featured: boolean;
  sort_order: number;
}

export interface Review extends Auditable {
  id: ID;
  customer_id: ID;
  product_id: ID;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_featured: boolean;
  is_approved: boolean;
  helpful_count: number;
}

export interface ReviewListItem extends Review {
  customer_name: string;
  product_name: string;
}

/* ------------------------------------------------------------------ content */

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface BlogPost extends Auditable {
  id: ID;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  is_featured: boolean;
  allow_comments: boolean;
  view_count: number;
  comment_count: number;
  cover_image: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  author_id: ID;
  published_at: Timestamp | null;
}

export interface BlogPostListItem extends BlogPost {
  author_name: string;
}

export interface BlogComment {
  id: ID;
  blog_post_id: ID;
  parent_id: ID | null;
  author_name: string;
  author_email: string;
  comment: string;
  is_approved: boolean;
  created_at: Timestamp;
}

export interface BlogCommentListItem extends BlogComment {
  post_title: string;
}

export interface ContactMessage {
  id: ID;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  replied_at: Timestamp | null;
  created_at: Timestamp;
}

export interface TeamMember extends Auditable {
  id: ID;
  name: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  linkedin: string;
  instagram: string;
  sort_order: number;
  is_active: boolean;
}

/* ---------------------------------------------------------------------- cms */

export interface HomeSection {
  id: ID;
  section_key: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  limit: number;
  is_active: boolean;
  sort_order: number;
}

export interface AboutSection {
  id: ID;
  section_key: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  features: string[];
  is_active: boolean;
}

export interface AboutStat {
  id: ID;
  icon: string;
  title: string;
  value: number;
  suffix: string;
  sort_order: number;
  is_active: boolean;
}

export type HeroPageKey = 'shop' | 'store' | 'blog';

export interface HeroPageSetting {
  page: HeroPageKey;
  hero_title: string;
  hero_subtitle: string;
  hero_left_badge: string;
  hero_right_badge: string;
}

export interface ContactSetting {
  hero_title: string;
  hero_subtitle: string;
  details_title: string;
  address: string;
  email: string;
  phone: string;
  fax: string;
  about_title: string;
  about_text: string;
  map_url: string;
}

/* ----------------------------------------------------------------- settings */

export interface Currency extends Auditable {
  id: ID;
  code: string;
  name: string;
  symbol: string;
  symbol_position: 'before' | 'after';
  decimal_places: number;
  exchange_rate: number;
  is_base: boolean;
  is_active: boolean;
  sort_order: number;
}

export const USER_ROLES = [
  'super_admin',
  'store_manager',
  'product_manager',
  'analytics_team',
  'customer_service',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AdminUser extends Auditable {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: Timestamp | null;
  permission_ids: ID[];
}

export interface Permission {
  id: ID;
  name: string;
  display_name: string;
  description: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'approve';
  is_system: boolean;
  is_active: boolean;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  support_email: string;
  support_phone: string;
  default_currency: string;
  tax_rate: number;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  low_stock_threshold: number;
  orders_require_confirmation: boolean;
  guest_checkout_enabled: boolean;
  reviews_require_approval: boolean;
  maintenance_mode: boolean;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
}

/* --------------------------------------------------------------- analytics */

export interface KpiDelta {
  value: number;
  previous: number;
  change_pct: number;
}

export interface DashboardSummary {
  revenue: KpiDelta;
  orders: KpiDelta;
  average_order_value: KpiDelta;
  new_customers: KpiDelta;
  revenue_series: { date: string; revenue: number; orders: number }[];
  status_breakdown: { status: OrderStatus; count: number; amount: number }[];
  top_products: {
    product_id: ID;
    name: string;
    sku: string;
    units: number;
    revenue: number;
    image_url: string;
  }[];
  category_split: { name: string; revenue: number }[];
  recent_orders: OrderListItem[];
  low_stock: InventoryListItem[];
  pending_actions: {
    unread_messages: number;
    pending_comments: number;
    pending_reviews: number;
    orders_awaiting: number;
  };
}
