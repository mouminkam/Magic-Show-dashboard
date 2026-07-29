import type {
  CouponType,
  OrderStatus,
  PaymentStatus,
  PostStatus,
  StockStatus,
  UserRole,
} from '@/types/domain';
import type { Tone } from '@/components/ui/badge';

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: 'caution',
  confirmed: 'info',
  processing: 'info',
  shipped: 'brand',
  delivered: 'positive',
  cancelled: 'neutral',
  refunded: 'critical',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/**
 * Which statuses an order may move to next. Delivered/cancelled/refunded are
 * terminal apart from the refund path, which mirrors the Laravel controller.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  pending: 'caution',
  paid: 'positive',
  failed: 'critical',
  refunded: 'neutral',
  partially_refunded: 'info',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
};

export const STOCK_STATUS_TONE: Record<StockStatus, Tone> = {
  in_stock: 'positive',
  low_stock: 'caution',
  out_of_stock: 'critical',
};

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

export const POST_STATUS_TONE: Record<PostStatus, Tone> = {
  draft: 'neutral',
  scheduled: 'info',
  published: 'positive',
  archived: 'neutral',
};

export const CONTACT_STATUS_TONE: Record<string, Tone> = {
  new: 'brand',
  read: 'info',
  replied: 'positive',
  archived: 'neutral',
};

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed amount',
  free_shipping: 'Free shipping',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super admin',
  store_manager: 'Store manager',
  product_manager: 'Product manager',
  analytics_team: 'Analytics',
  customer_service: 'Customer service',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: 'Card',
  cash_on_delivery: 'Cash on delivery',
  bank_transfer: 'Bank transfer',
  wallet: 'Wallet',
};
