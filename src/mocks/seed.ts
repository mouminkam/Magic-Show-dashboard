/**
 * Builds the entire demo dataset from a fixed seed.
 *
 * Everything downstream (services, queries, screens) reads this snapshot, so
 * the shape here is the contract. Regenerating with the same seed produces a
 * byte-identical database, which is what makes "Reset demo data" trustworthy.
 */

import { Rng, addDays, addHours, iso } from './random';
import { avatarImage, bannerImage, tileImage } from './imagery';
import {
  ABOUT_SECTIONS,
  ADMIN_USERS,
  BLOG_BODY,
  BLOG_POSTS,
  BRANCHES,
  BRAND_COUNTRIES,
  BRAND_NAMES,
  CATEGORY_TREE,
  CITIES,
  COLORS,
  CONTACT_SUBJECTS,
  COUPONS,
  CURRENCIES,
  FIRST_NAMES,
  HOME_SECTIONS,
  LAST_NAMES,
  MATERIALS,
  PERMISSION_MODULES,
  PRODUCTS,
  REVIEW_BODIES,
  REVIEW_TITLES,
  SEASONS,
  SHIPPING_METHODS,
  SIZES,
  STREETS,
  TEAM,
  TESTIMONIALS,
  WAREHOUSES,
} from './content';
import { slugify } from '@/lib/utils';
import type {
  AboutSection,
  AboutStat,
  Address,
  AdminUser,
  BlogComment,
  BlogPost,
  Brand,
  Branch,
  Category,
  Color,
  ContactMessage,
  ContactSetting,
  Coupon,
  CouponUsage,
  Currency,
  Customer,
  HeroPageSetting,
  HomeSection,
  ID,
  InventoryRow,
  Material,
  NewsletterSubscriber,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Permission,
  Product,
  ProductAttribute,
  ProductImage,
  ProductVariant,
  Review,
  Season,
  Size,
  StockMovement,
  StoreSettings,
  TeamMember,
  Testimonial,
  UserRole,
  Warehouse,
} from '@/types/domain';

export const SEED_VERSION = 3;

/** Fixed "now" anchor keeps relative dates sensible without drifting daily. */
const NOW = Date.now();

export interface MockDatabase {
  version: number;
  generated_at: string;
  categories: Category[];
  brands: Brand[];
  colors: Color[];
  sizes: Size[];
  materials: Material[];
  seasons: Season[];
  productAttributes: ProductAttribute[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  couponUsages: CouponUsage[];
  subscribers: NewsletterSubscriber[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  blogComments: BlogComment[];
  contactMessages: ContactMessage[];
  teamMembers: TeamMember[];
  warehouses: Warehouse[];
  branches: Branch[];
  inventory: InventoryRow[];
  stockMovements: StockMovement[];
  currencies: Currency[];
  adminUsers: AdminUser[];
  permissions: Permission[];
  homeSections: HomeSection[];
  aboutSections: AboutSection[];
  aboutStats: AboutStat[];
  heroPages: HeroPageSetting[];
  contactSetting: ContactSetting;
  storeSettings: StoreSettings;
}

function ts(date: Date): { created_at: string; updated_at: string } {
  return { created_at: iso(date), updated_at: iso(date) };
}

export function buildDatabase(): MockDatabase {
  const rng = new Rng(20260727);
  const baseline = new Date(NOW - 400 * 86_400_000);

  /* ------------------------------------------------------------ taxonomy */

  const categories: Category[] = [];
  CATEGORY_TREE.forEach(([name, parentName], index) => {
    const parent = parentName ? categories.find((c) => c.name === parentName) : undefined;
    categories.push({
      id: index + 1,
      name,
      slug: slugify(name),
      description: parent
        ? `${name} within our ${parentName} range, curated for the ${rng.pick(['GCC climate', 'city commute', 'weekend', 'workwear rotation'])}.`
        : `The full ${name.toLowerCase()} offer across every Magic Show branch.`,
      parent_id: parent ? parent.id : null,
      sort_order: index + 1,
      is_active: true,
      meta_title: `${name} | Magic Show`,
      meta_description: `Shop ${name.toLowerCase()} at Magic Show — free fittings in five GCC branches.`,
      ...ts(baseline),
    });
  });

  const brands: Brand[] = BRAND_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    slug: slugify(name),
    description: `${name} has supplied Magic Show since ${2016 + (index % 8)}, specialising in ${rng.pick(['welted footwear', 'knitwear', 'technical outerwear', 'leather goods', 'performance trainers'])}.`,
    website: `https://www.${slugify(name)}.com`,
    contact_email: `wholesale@${slugify(name)}.com`,
    contact_phone: `+971 4 ${rng.int(200, 899)} ${rng.int(1000, 9999)}`,
    country: BRAND_COUNTRIES[index % BRAND_COUNTRIES.length]!,
    is_active: true,
    is_featured: index < 4,
    sort_order: index + 1,
    ...ts(baseline),
  }));

  const colors: Color[] = COLORS.map(([name, hex, family], index) => ({
    id: index + 1,
    name,
    hex_code: hex,
    family,
    is_active: index < 14,
    sort_order: index + 1,
    ...ts(baseline),
  }));

  const sizes: Size[] = SIZES.map(([name, scale], index) => ({
    id: index + 1,
    name,
    scale,
    sort_order: index + 1,
    is_active: true,
    ...ts(baseline),
  }));

  const materials: Material[] = MATERIALS.map(([name, category], index) => ({
    id: index + 1,
    name,
    slug: slugify(name),
    description: `${name} sourced from our ${category.toLowerCase()} suppliers and graded before cutting.`,
    category,
    is_active: true,
    sort_order: index + 1,
    ...ts(baseline),
  }));

  const seasons: Season[] = SEASONS.map(([name, value], index) => ({
    id: index + 1,
    name,
    value,
    sort_order: index + 1,
    is_active: index !== 0,
    ...ts(baseline),
  }));

  const productAttributes: ProductAttribute[] = [
    ['Toe Shape', 'select', ['Round', 'Almond', 'Square', 'Pointed']],
    ['Sole Construction', 'select', ['Goodyear welt', 'Cupsole', 'Vulcanised', 'Cemented', 'Crepe']],
    ['Heel Height', 'select', ['Flat', '30mm', '60mm', '90mm', '110mm']],
    ['Lining', 'select', ['Full leather', 'Textile', 'Unlined', 'Shearling']],
    ['Water Resistant', 'boolean', []],
    ['Care Instructions', 'text', []],
  ].map(([name, type, options], index) => ({
    id: index + 1,
    name: name as string,
    slug: slugify(name as string),
    description: `Merchandising attribute surfaced as a storefront filter on ${(name as string).toLowerCase()}.`,
    type: type as ProductAttribute['type'],
    is_required: index < 2,
    is_filterable: index !== 5,
    is_visible: true,
    sort_order: index + 1,
    options: options as string[],
    ...ts(baseline),
  }));

  /* ------------------------------------------------------------- products */

  const products: Product[] = PRODUCTS.map(([name, categoryName, basePrice, blurb], index) => {
    const id = index + 1;
    const category = categories.find((c) => c.name === categoryName)!;
    const brand = brands[index % brands.length]!;
    const material = materials[index % materials.length]!;
    const season = seasons[index % seasons.length]!;
    const createdAt = rng.dateWithin(360, 20, NOW);

    const onSale = rng.bool(0.28);
    const price = basePrice;
    const salePrice = onSale ? Math.round(price * rng.float(0.65, 0.85)) : null;

    const colorIds = rng.sample(
      colors.filter((c) => c.is_active).map((c) => c.id),
      rng.int(2, 4),
    );
    const isApparel = ['Outerwear', 'Knitwear', 'Shirts & Tops'].includes(categoryName);
    const isAccessory = ['Bags', 'Belts & Small Leather'].includes(categoryName);
    const sizePool = isApparel
      ? sizes.filter((s) => s.scale === 'alpha')
      : isAccessory
        ? []
        : sizes.filter((s) => s.scale === 'eu');
    const sizeIds = sizePool.length ? sizePool.map((s) => s.id).slice(0, rng.int(4, sizePool.length)) : [];

    const sku = `MS-${categoryName.slice(0, 2).toUpperCase()}-${String(1000 + id * 7)}`;

    const images: ProductImage[] = Array.from({ length: rng.int(2, 4) }, (_, i) => ({
      id: id * 100 + i,
      url: tileImage(name, i),
      alt_text: `${name} — view ${i + 1}`,
      is_primary: i === 0,
      order: i,
    }));

    const variants: ProductVariant[] = [];
    let variantSeq = 0;
    for (const colorId of colorIds.slice(0, 2)) {
      const variantSizes = sizeIds.length ? sizeIds.slice(0, 4) : [null];
      for (const sizeId of variantSizes) {
        variantSeq += 1;
        variants.push({
          id: id * 1000 + variantSeq,
          sku: `${sku}-${variantSeq.toString().padStart(2, '0')}`,
          color_id: colorId,
          size_id: sizeId,
          price_delta: rng.bool(0.15) ? rng.int(1, 4) * 25 : 0,
          quantity: rng.int(0, 40),
          barcode: `62${rng.int(10000000000, 99999999999)}`,
        });
      }
    }

    const quantity = variants.reduce((sum, v) => sum + v.quantity, 0);
    const reviewCount = rng.int(0, 64);

    return {
      id,
      name,
      slug: slugify(name),
      sku,
      brand_id: brand.id,
      category_id: category.id,
      material_id: material.id,
      season_id: season.id,
      description: `${blurb}\n\nBuilt on the last we redrew for AW25 and finished by hand in our Dubai workshop. Every pair ships with a dust bag and a care card, and every welted style is covered by the Magic Show resole programme.`,
      short_description: blurb,
      price,
      sale_price: salePrice,
      compare_price: onSale ? price : null,
      cost_price: Math.round(price * rng.float(0.34, 0.48)),
      quantity,
      min_quantity: rng.int(6, 14),
      weight: Math.round(rng.float(0.3, 2.4) * 100) / 100,
      barcode: `62${rng.int(10000000000, 99999999999)}`,
      model: `${name.split(' ')[0]!.toUpperCase()}-${2025 + (index % 2)}`,
      images,
      variants,
      color_ids: colorIds,
      size_ids: sizeIds,
      attributes: {
        'toe-shape': rng.pick(['Round', 'Almond', 'Square', 'Pointed']),
        'sole-construction': rng.pick(['Goodyear welt', 'Cupsole', 'Vulcanised', 'Cemented', 'Crepe']),
        lining: rng.pick(['Full leather', 'Textile', 'Unlined']),
      },
      is_active: rng.bool(0.92),
      is_featured: rng.bool(0.22),
      requires_shipping: true,
      track_quantity: true,
      allow_backorder: rng.bool(0.18),
      meta_title: `${name} | Magic Show`,
      meta_description: blurb.slice(0, 150),
      sort_order: index + 1,
      published_at: iso(createdAt),
      rating: reviewCount ? Math.round(rng.float(3.4, 5) * 10) / 10 : 0,
      review_count: reviewCount,
      units_sold: 0,
      ...ts(createdAt),
    } satisfies Product;
  });

  /* ------------------------------------------------------------ customers */

  const usedEmails = new Set<string>();
  const customers: Customer[] = Array.from({ length: 36 }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length]!;
    let email = `${slugify(first)}.${slugify(last)}@${rng.pick(['gmail.com', 'outlook.com', 'proton.me', 'icloud.com', 'zohomail.com'])}`;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = email.replace('@', `${suffix}@`);
      suffix += 1;
    }
    usedEmails.add(email);

    const [city, state, country] = CITIES[index % CITIES.length]!;
    const createdAt = rng.dateWithin(380, 5, NOW);

    return {
      id: index + 1,
      first_name: first,
      last_name: last,
      email,
      phone: `+971 5${rng.int(0, 9)} ${rng.int(100, 999)} ${rng.int(1000, 9999)}`,
      date_of_birth: iso(new Date(NOW - rng.int(20, 55) * 365 * 86_400_000)).slice(0, 10),
      gender: rng.weighted([
        ['female' as const, 5],
        ['male' as const, 4],
        ['other' as const, 1],
      ]),
      address: `${rng.int(1, 240)} ${rng.pick(STREETS)}`,
      city,
      state,
      country,
      postal_code: String(rng.int(10000, 99999)),
      is_active: rng.bool(0.93),
      email_verified: rng.bool(0.86),
      phone_verified: rng.bool(0.62),
      last_login_at: rng.bool(0.85) ? iso(rng.dateWithin(60, 0, NOW)) : null,
      preferred_language: rng.bool(0.6) ? 'en' : 'ar',
      preferred_currency: rng.weighted([
        ['AED', 7],
        ['SAR', 2],
        ['USD', 1],
      ]),
      notes: rng.bool(0.22)
        ? rng.pick([
            'Prefers click & collect at Dubai Mall.',
            'Wide fitting — always size up half a size.',
            'VIP: invite to seasonal preview evenings.',
            'Two open exchanges resolved in 2025, both size-related.',
            'Corporate account — invoices need the company TRN.',
          ])
        : '',
      marketing_opt_in: rng.bool(0.64),
      ...ts(createdAt),
    } satisfies Customer;
  });

  /* --------------------------------------------------------------- orders */

  const statusWeights: readonly (readonly [OrderStatus, number])[] = [
    ['delivered', 34],
    ['shipped', 14],
    ['processing', 12],
    ['confirmed', 10],
    ['pending', 12],
    ['cancelled', 10],
    ['refunded', 8],
  ];

  const orders: Order[] = [];
  const ORDER_COUNT = 84;
  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const id = i + 1;
    const customer = rng.pick(customers);
    const placedAt = rng.dateWithin(365, 0, NOW);
    const status = rng.weighted(statusWeights);

    const itemCount = rng.weighted([
      [1, 5],
      [2, 4],
      [3, 2],
      [4, 1],
    ]);
    const chosen = rng.sample(products, itemCount);

    const items: OrderItem[] = chosen.map((product, idx) => {
      const qty = rng.weighted([
        [1, 8],
        [2, 3],
        [3, 1],
      ]);
      const unit = product.sale_price ?? product.price;
      const variant = product.variants.length ? rng.pick(product.variants) : null;
      const color = variant?.color_id ? colors.find((c) => c.id === variant.color_id) : null;
      const size = variant?.size_id ? sizes.find((s) => s.id === variant.size_id) : null;
      const label = [color?.name, size?.name].filter(Boolean).join(' · ');
      const discount = rng.bool(0.18) ? Math.round(unit * qty * 0.1) : 0;
      const lineTotal = unit * qty - discount;
      return {
        id: id * 100 + idx,
        product_id: product.id,
        product_name: product.name,
        product_sku: variant?.sku ?? product.sku,
        variant_label: label || 'One size',
        quantity: qty,
        unit_price: unit,
        discount_amount: discount,
        tax_amount: Math.round(lineTotal * 0.05 * 100) / 100,
        total_price: lineTotal,
        image_url: product.images[0]?.url ?? tileImage(product.name),
      } satisfies OrderItem;
    });

    const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const itemDiscount = items.reduce((s, it) => s + it.discount_amount, 0);
    const coupon = rng.bool(0.24) ? COUPONS[rng.int(0, COUPONS.length - 1)]! : null;
    const couponDiscount = coupon
      ? coupon[2] === 'percentage'
        ? Math.round(subtotal * (coupon[3] / 100))
        : coupon[2] === 'fixed_amount'
          ? Math.min(coupon[3], Math.round(subtotal * 0.4))
          : 0
      : 0;
    const discountTotal = itemDiscount + couponDiscount;
    const shipping = coupon?.[2] === 'free_shipping' || subtotal > 800 ? 0 : 35;
    const tax = Math.round((subtotal - discountTotal) * 0.05 * 100) / 100;
    const total = Math.round((subtotal - discountTotal + shipping + tax) * 100) / 100;

    const [city, state, country] = CITIES[(customer.id + i) % CITIES.length]!;
    const address: Address = {
      name: `${customer.first_name} ${customer.last_name}`,
      phone: customer.phone,
      line1: `${rng.int(1, 240)} ${rng.pick(STREETS)}`,
      line2: rng.bool(0.5) ? `Apt ${rng.int(1, 40)}${rng.pick(['A', 'B', 'C', ''])}` : '',
      city,
      state,
      country,
      postal_code: String(rng.int(10000, 99999)),
    };

    const paymentStatus: PaymentStatus =
      status === 'refunded'
        ? rng.bool(0.75)
          ? 'refunded'
          : 'partially_refunded'
        : status === 'cancelled'
          ? rng.bool(0.5)
            ? 'failed'
            : 'pending'
          : status === 'pending'
            ? 'pending'
            : 'paid';

    const confirmedAt = ['pending'].includes(status) ? null : addHours(placedAt, rng.int(1, 20));
    const shippedAt = ['shipped', 'delivered', 'refunded'].includes(status)
      ? addDays(placedAt, rng.int(1, 3))
      : null;
    const deliveredAt = ['delivered', 'refunded'].includes(status)
      ? addDays(shippedAt ?? placedAt, rng.int(1, 5))
      : null;
    const cancelledAt = status === 'cancelled' ? addHours(placedAt, rng.int(2, 60)) : null;

    orders.push({
      id,
      order_number: `MS-2026-${String(300 + id).padStart(4, '0')}`,
      customer_id: customer.id,
      status,
      payment_status: paymentStatus,
      payment_method: rng.weighted([
        ['card' as const, 6],
        ['cash_on_delivery' as const, 3],
        ['bank_transfer' as const, 1],
        ['wallet' as const, 1],
      ]),
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: tax,
      shipping_amount: shipping,
      discount_amount: discountTotal,
      total_amount: total,
      currency: 'AED',
      shipping_address: address,
      billing_address: address,
      shipping_method: rng.pick(SHIPPING_METHODS),
      customer_notes: rng.bool(0.2)
        ? rng.pick([
            'Please leave with the building concierge.',
            'Gift — no invoice in the box please.',
            'Call before delivery, I work shifts.',
            'Deliver after 6pm if possible.',
          ])
        : '',
      admin_notes: rng.bool(0.14)
        ? rng.pick([
            'Customer called to confirm sizing before dispatch.',
            'Flagged for QC — second exchange on this SKU.',
            'Split shipment: boots from JAFZA, belt from DIP.',
          ])
        : '',
      tracking_number: shippedAt ? `AE${rng.int(100000000, 999999999)}MS` : '',
      coupon_code: coupon ? coupon[0] : null,
      confirmed_at: confirmedAt ? iso(confirmedAt) : null,
      shipped_at: shippedAt ? iso(shippedAt) : null,
      delivered_at: deliveredAt ? iso(deliveredAt) : null,
      cancelled_at: cancelledAt ? iso(cancelledAt) : null,
      items,
      created_at: iso(placedAt),
      updated_at: iso(deliveredAt ?? shippedAt ?? confirmedAt ?? placedAt),
    });
  }

  orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  // Roll fulfilled units back onto the products so "top sellers" is truthful.
  const soldByProduct = new Map<ID, number>();
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) {
      soldByProduct.set(item.product_id, (soldByProduct.get(item.product_id) ?? 0) + item.quantity);
    }
  }
  for (const product of products) {
    product.units_sold = soldByProduct.get(product.id) ?? 0;
  }

  /* -------------------------------------------------------------- reviews */

  const reviews: Review[] = [];
  let reviewId = 0;
  for (const product of products) {
    const count = Math.min(product.review_count, rng.int(0, 5));
    for (let i = 0; i < count; i += 1) {
      reviewId += 1;
      const customer = rng.pick(customers);
      reviews.push({
        id: reviewId,
        customer_id: customer.id,
        product_id: product.id,
        rating: rng.weighted([
          [5, 8],
          [4, 6],
          [3, 3],
          [2, 1],
          [1, 1],
        ]),
        title: rng.pick(REVIEW_TITLES),
        comment: rng.pick(REVIEW_BODIES),
        is_verified_purchase: rng.bool(0.82),
        is_featured: rng.bool(0.08),
        is_approved: rng.bool(0.82),
        helpful_count: rng.int(0, 42),
        ...ts(rng.dateWithin(300, 1, NOW)),
      });
    }
  }

  /* ------------------------------------------------------------ marketing */

  const coupons: Coupon[] = COUPONS.map(([code, name, type, value], index) => {
    const startsAt = rng.dateWithin(300, 30, NOW);
    const expires = rng.bool(0.75) ? addDays(startsAt, rng.int(30, 240)) : null;
    return {
      id: index + 1,
      code,
      name,
      description: `${name} — applied automatically at checkout when the basket qualifies.`,
      type: type as Coupon['type'],
      value,
      minimum_amount: rng.pick([0, 250, 500, 800]),
      maximum_discount: type === 'percentage' ? rng.pick([300, 500, null]) : null,
      usage_limit: rng.bool(0.7) ? rng.int(50, 500) : null,
      usage_limit_per_customer: rng.pick([1, 1, 2, 3]),
      used_count: 0,
      is_active: expires === null || expires.getTime() > NOW,
      is_public: rng.bool(0.7),
      starts_at: iso(startsAt),
      expires_at: expires ? iso(expires) : null,
      terms_and_conditions:
        'Cannot be combined with other offers. Excludes gift cards and already-reduced lines. Valid on magicshow.ae and in all GCC branches.',
      ...ts(startsAt),
    } satisfies Coupon;
  });

  const couponUsages: CouponUsage[] = [];
  let usageId = 0;
  for (const order of orders) {
    if (!order.coupon_code || order.discount_amount <= 0) continue;
    const coupon = coupons.find((c) => c.code === order.coupon_code);
    if (!coupon) continue;
    const customer = customers.find((c) => c.id === order.customer_id)!;
    usageId += 1;
    couponUsages.push({
      id: usageId,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      customer_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      order_id: order.id,
      order_number: order.order_number,
      discount_amount: order.discount_amount,
      order_total: order.total_amount,
      used_at: order.created_at,
    });
    coupon.used_count += 1;
  }

  const subscribers: NewsletterSubscriber[] = Array.from({ length: 48 }, (_, index) => {
    const first = FIRST_NAMES[(index * 3 + 1) % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(index * 5 + 2) % LAST_NAMES.length]!;
    const subscribedAt = rng.dateWithin(400, 1, NOW);
    const unsubscribed = rng.bool(0.16);
    return {
      id: index + 1,
      email: `${slugify(first)}.${slugify(last)}${index}@${rng.pick(['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me'])}`,
      name: `${first} ${last}`,
      source: rng.weighted([
        ['footer' as const, 5],
        ['checkout' as const, 3],
        ['popup' as const, 2],
        ['import' as const, 1],
      ]),
      subscribed_at: iso(subscribedAt),
      unsubscribed_at: unsubscribed ? iso(addDays(subscribedAt, rng.int(5, 200))) : null,
    };
  });

  const testimonials: Testimonial[] = TESTIMONIALS.map(([name, role, text], index) => ({
    id: index + 1,
    customer_name: name,
    customer_role: role,
    text,
    rating: rng.weighted([
      [5, 6],
      [4, 2],
    ]),
    is_featured: index < 4,
    sort_order: index + 1,
    ...ts(rng.dateWithin(300, 10, NOW)),
  }));

  /* -------------------------------------------------------------- content */

  const adminUsers: AdminUser[] = ADMIN_USERS.map(([name, email, role], index) => ({
    id: index + 1,
    name,
    email,
    role: role as UserRole,
    is_active: index !== ADMIN_USERS.length - 1,
    last_login_at: rng.bool(0.9) ? iso(rng.dateWithin(20, 0, NOW)) : null,
    permission_ids: [],
    ...ts(rng.dateWithin(700, 300, NOW)),
  }));

  const permissions: Permission[] = [];
  let permId = 0;
  for (const [module, actions] of PERMISSION_MODULES) {
    for (const action of actions) {
      permId += 1;
      permissions.push({
        id: permId,
        name: `${module}.${action}`,
        display_name: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${module}`,
        description: `Allows the holder to ${action} records in the ${module} module.`,
        module,
        action: action as Permission['action'],
        is_system: action === 'read',
        is_active: true,
      });
    }
  }
  for (const user of adminUsers) {
    user.permission_ids =
      user.role === 'super_admin'
        ? permissions.map((p) => p.id)
        : permissions
            .filter((p) => {
              if (user.role === 'product_manager') return ['catalog', 'inventory'].includes(p.module);
              if (user.role === 'store_manager') return ['orders', 'inventory', 'customers'].includes(p.module);
              if (user.role === 'customer_service') return ['orders', 'customers', 'content'].includes(p.module);
              return p.action === 'read' || p.action === 'export';
            })
            .map((p) => p.id);
  }

  const blogPosts: BlogPost[] = BLOG_POSTS.map(([title, excerpt, tags], index) => {
    const createdAt = rng.dateWithin(340, 2, NOW);
    const status = rng.weighted<BlogPost['status']>([
      ['published', 7],
      ['draft', 2],
      ['scheduled', 1],
      ['archived', 1],
    ]);
    return {
      id: index + 1,
      title,
      slug: slugify(title),
      excerpt,
      content: BLOG_BODY,
      status,
      is_featured: index < 3,
      allow_comments: rng.bool(0.85),
      view_count: rng.int(120, 9800),
      comment_count: 0,
      cover_image: bannerImage(title, index),
      tags: [...tags],
      meta_title: `${title} | Magic Show Journal`,
      meta_description: excerpt.slice(0, 155),
      author_id: adminUsers[index % adminUsers.length]!.id,
      published_at: status === 'published' ? iso(createdAt) : status === 'scheduled' ? iso(addDays(new Date(NOW), rng.int(2, 20))) : null,
      ...ts(createdAt),
    } satisfies BlogPost;
  });

  const COMMENT_BODIES = [
    'This answered a question I have had since I bought my first pair. Thank you for writing it up.',
    'Would love to see the same breakdown for the suede styles — the care routine is completely different.',
    'I sent my Bramwells back for a resole in March and they came back looking new. Can confirm the programme works.',
    'Any chance of a video version? The lasting step is hard to picture from text alone.',
    'Great piece. The point about cost per wear is the one I keep failing to explain to friends.',
    'Slight disagreement on the crepe sole advice — mine picked up every bit of grit in Dubai.',
    'Bookmarked. Ordering the Meridian this week on the back of this.',
    'Is the conversion chart available as a PDF? Would like to print it for the office.',
  ];

  const blogComments: BlogComment[] = [];
  let commentId = 0;
  for (const post of blogPosts) {
    if (!post.allow_comments) continue;
    const count = rng.int(0, 6);
    for (let i = 0; i < count; i += 1) {
      commentId += 1;
      const first = FIRST_NAMES[(commentId * 3) % FIRST_NAMES.length]!;
      const last = LAST_NAMES[(commentId * 5) % LAST_NAMES.length]!;
      blogComments.push({
        id: commentId,
        blog_post_id: post.id,
        parent_id: null,
        author_name: `${first} ${last}`,
        author_email: `${slugify(first)}.${slugify(last)}@${rng.pick(['gmail.com', 'outlook.com', 'proton.me'])}`,
        comment: COMMENT_BODIES[commentId % COMMENT_BODIES.length]!,
        is_approved: rng.bool(0.7),
        created_at: iso(rng.dateWithin(200, 1, NOW)),
      });
      post.comment_count += 1;
    }
  }

  const contactMessages: ContactMessage[] = CONTACT_SUBJECTS.map(([subject, message], index) => {
    const createdAt = rng.dateWithin(120, 0, NOW);
    const status = rng.weighted<ContactMessage['status']>([
      ['new', 4],
      ['read', 3],
      ['replied', 4],
      ['archived', 2],
    ]);
    const first = FIRST_NAMES[(index * 4 + 2) % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(index * 3 + 5) % LAST_NAMES.length]!;
    return {
      id: index + 1,
      first_name: first,
      last_name: last,
      email: `${slugify(first)}.${slugify(last)}@${rng.pick(['gmail.com', 'outlook.com', 'company.ae', 'proton.me'])}`,
      phone: `+971 5${rng.int(0, 9)} ${rng.int(100, 999)} ${rng.int(1000, 9999)}`,
      subject,
      message,
      status,
      replied_at: status === 'replied' ? iso(addHours(createdAt, rng.int(2, 48))) : null,
      created_at: iso(createdAt),
    } satisfies ContactMessage;
  });

  const teamMembers: TeamMember[] = TEAM.map(([name, role, bio], index) => ({
    id: index + 1,
    name,
    role,
    bio,
    email: `${slugify(name).replace('-', '.')}@magicshow.ae`,
    phone: `+971 4 ${rng.int(200, 899)} ${rng.int(1000, 9999)}`,
    linkedin: `https://linkedin.com/in/${slugify(name)}`,
    instagram: `https://instagram.com/${slugify(name).replace(/-/g, '')}`,
    sort_order: index + 1,
    is_active: true,
    ...ts(baseline),
  }));

  /* ------------------------------------------------------------ inventory */

  const warehouses: Warehouse[] = WAREHOUSES.map(([name, code, type, city], index) => ({
    id: index + 1,
    name,
    code,
    type: type as Warehouse['type'],
    address: `${rng.int(1, 90)} ${rng.pick(STREETS)}`,
    city,
    country: city === 'Riyadh' ? 'Saudi Arabia' : 'United Arab Emirates',
    phone: `+971 4 ${rng.int(200, 899)} ${rng.int(1000, 9999)}`,
    email: `${code.toLowerCase()}@magicshow.ae`,
    manager_name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    capacity: rng.int(4, 40) * 500,
    capacity_unit: 'units',
    is_active: true,
    ...ts(baseline),
  }));

  const branches: Branch[] = BRANCHES.map(([name, code, city], index) => ({
    id: index + 1,
    name,
    code,
    address: `${rng.pick(['Level 1', 'Level 2', 'Ground Floor'])}, ${rng.pick(STREETS)}`,
    city,
    country: city === 'Riyadh' ? 'Saudi Arabia' : 'United Arab Emirates',
    phone: `+971 4 ${rng.int(200, 899)} ${rng.int(1000, 9999)}`,
    email: `${code.toLowerCase()}@magicshow.ae`,
    manager_name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    opening_time: '10:00',
    closing_time: rng.pick(['22:00', '23:00', '00:00']),
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    is_active: index !== BRANCHES.length - 1,
    ...ts(baseline),
  }));

  const inventory: InventoryRow[] = [];
  let invId = 0;
  for (const product of products) {
    const locations: { type: 'warehouse' | 'branch'; id: number }[] = [
      { type: 'warehouse', id: warehouses[0]!.id },
      ...rng
        .sample(warehouses.slice(1), rng.int(0, 1))
        .map((w) => ({ type: 'warehouse' as const, id: w.id })),
      ...rng.sample(branches, rng.int(1, 3)).map((b) => ({ type: 'branch' as const, id: b.id })),
    ];
    for (const loc of locations) {
      invId += 1;
      const min = rng.int(4, 12);
      const qty = rng.weighted([
        [0, 1],
        [rng.int(1, min), 2],
        [rng.int(min + 1, 60), 7],
      ]);
      inventory.push({
        id: invId,
        product_id: product.id,
        location_type: loc.type,
        location_id: loc.id,
        quantity: qty,
        reserved_quantity: qty > 0 ? rng.int(0, Math.min(5, qty)) : 0,
        min_quantity: min,
        max_quantity: min * rng.int(6, 14),
        cost_price: product.cost_price,
        rack_location: `R${rng.int(1, 24)}`,
        shelf_location: `${rng.pick(['A', 'B', 'C', 'D'])}${rng.int(1, 9)}`,
        notes: '',
        is_active: true,
        ...ts(rng.dateWithin(90, 0, NOW)),
      });
    }
  }

  const MOVEMENT_REASONS: StockMovement['reason'][] = [
    'restock',
    'sale',
    'damage',
    'correction',
    'transfer',
    'return',
  ];
  const stockMovements: StockMovement[] = Array.from({ length: 72 }, (_, index) => {
    const row = rng.pick(inventory);
    const product = products.find((p) => p.id === row.product_id)!;
    const location =
      row.location_type === 'warehouse'
        ? warehouses.find((w) => w.id === row.location_id)!.name
        : branches.find((b) => b.id === row.location_id)!.name;
    const reason = rng.pick(MOVEMENT_REASONS);
    const delta =
      reason === 'restock' || reason === 'return'
        ? rng.int(5, 60)
        : reason === 'correction'
          ? rng.int(-6, 6)
          : -rng.int(1, 12);
    return {
      id: index + 1,
      inventory_id: row.id,
      product_name: product.name,
      location_name: location,
      delta,
      resulting_quantity: Math.max(0, row.quantity + delta),
      reason,
      note:
        reason === 'damage'
          ? 'Box crushed in transit, written off after QC.'
          : reason === 'transfer'
            ? 'Moved to cover branch demand.'
            : '',
      actor: rng.pick(ADMIN_USERS.map(([name]) => name)),
      created_at: iso(rng.dateWithin(120, 0, NOW)),
    } satisfies StockMovement;
  }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  /* ------------------------------------------------------------- settings */

  const currencies: Currency[] = CURRENCIES.map(([code, name, symbol, rate, isBase], index) => ({
    id: index + 1,
    code,
    name,
    symbol,
    symbol_position: symbol.length > 1 ? 'before' : 'before',
    decimal_places: code === 'KWD' ? 3 : 2,
    exchange_rate: rate,
    is_base: isBase,
    is_active: index < 5,
    sort_order: index + 1,
    ...ts(baseline),
  }));

  const homeSections: HomeSection[] = HOME_SECTIONS.map(([key, title, subtitle, description], index) => ({
    id: index + 1,
    section_key: key,
    title,
    subtitle,
    description,
    button_text: rng.pick(['Shop the collection', 'Explore', 'See all', 'Read more']),
    button_link: `/${key.replace(/_/g, '-')}`,
    limit: rng.pick([4, 6, 8, 12]),
    is_active: index !== HOME_SECTIONS.length - 1,
    sort_order: index + 1,
  }));

  const aboutSections: AboutSection[] = ABOUT_SECTIONS.map(
    ([key, title, subtitle, description, features], index) => ({
      id: index + 1,
      section_key: key,
      title,
      subtitle,
      description,
      button_text: index === 0 ? 'Read our story' : '',
      button_link: index === 0 ? '/about' : '',
      features: [...features],
      is_active: true,
    }),
  );

  const aboutStats: AboutStat[] = [
    ['Storefront', 'Pairs shipped', 214000, '+'],
    ['ArrowsClockwise', 'Pairs resoled', 11400, '+'],
    ['Buildings', 'GCC branches', 5, ''],
    ['Star', 'Average review', 4.7, '/5'],
  ].map(([icon, title, value, suffix], index) => ({
    id: index + 1,
    icon: icon as string,
    title: title as string,
    value: value as number,
    suffix: suffix as string,
    sort_order: index + 1,
    is_active: true,
  }));

  const heroPages: HeroPageSetting[] = [
    {
      page: 'shop',
      hero_title: 'The Shop',
      hero_subtitle: 'Every silhouette we make, in every size we stock.',
      hero_left_badge: 'Free fittings',
      hero_right_badge: 'Same-day Dubai',
    },
    {
      page: 'store',
      hero_title: 'Where to Find Us',
      hero_subtitle: 'Five branches across the GCC, all with a fitting bench.',
      hero_left_badge: 'Open until 22:00',
      hero_right_badge: 'Click & collect',
    },
    {
      page: 'blog',
      hero_title: 'The Journal',
      hero_subtitle: 'Care guides, collection notes, and the occasional essay.',
      hero_left_badge: 'Updated weekly',
      hero_right_badge: 'No sponsored posts',
    },
  ];

  const contactSetting: ContactSetting = {
    hero_title: 'Talk to a human',
    hero_subtitle: 'Our customer experience team answers within one business day.',
    details_title: 'Head office',
    address: 'Warehouse 14, Al Quoz Industrial 3, Dubai, United Arab Emirates',
    email: 'hello@magicshow.ae',
    phone: '+971 4 355 2200',
    fax: '+971 4 355 2201',
    about_title: 'Prefer to come in?',
    about_text:
      'All five branches run a free fitting service with no appointment needed. Bring the socks you plan to wear — it changes the fit more than people expect.',
    map_url: 'https://maps.google.com/?q=Al+Quoz+Industrial+3+Dubai',
  };

  const storeSettings: StoreSettings = {
    store_name: 'Magic Show',
    tagline: 'Shoes built to be resoled, not replaced.',
    support_email: 'hello@magicshow.ae',
    support_phone: '+971 4 355 2200',
    default_currency: 'AED',
    tax_rate: 5,
    free_shipping_threshold: 800,
    standard_shipping_fee: 35,
    low_stock_threshold: 10,
    orders_require_confirmation: true,
    guest_checkout_enabled: true,
    reviews_require_approval: true,
    maintenance_mode: false,
    facebook_url: 'https://facebook.com/magicshowae',
    instagram_url: 'https://instagram.com/magicshowae',
    tiktok_url: 'https://tiktok.com/@magicshowae',
  };

  return {
    version: SEED_VERSION,
    generated_at: iso(new Date(NOW)),
    categories,
    brands,
    colors,
    sizes,
    materials,
    seasons,
    productAttributes,
    products,
    customers,
    orders,
    reviews,
    coupons,
    couponUsages,
    subscribers,
    testimonials,
    blogPosts,
    blogComments,
    contactMessages,
    teamMembers,
    warehouses,
    branches,
    inventory,
    stockMovements,
    currencies,
    adminUsers,
    permissions,
    homeSections,
    aboutSections,
    aboutStats,
    heroPages,
    contactSetting,
    storeSettings,
  };
}

/** Avatar helper re-exported so screens don't import the imagery module. */
export { avatarImage };
