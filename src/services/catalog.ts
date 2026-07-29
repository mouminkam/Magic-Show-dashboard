/** Catalog endpoints: products plus every taxonomy that hangs off them. */

import { getDb, nextId, nowIso } from '@/mocks/db';
import { tileImage } from '@/mocks/imagery';
import { slugify } from '@/lib/utils';
import { createCrudService } from './crud';
import { ApiError, notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type {
  Brand,
  Category,
  Color,
  Material,
  Product,
  ProductAttribute,
  ProductImage,
  ProductListItem,
  ProductVariant,
  Review,
  ReviewListItem,
  Season,
  Size,
  StockStatus,
} from '@/types/domain';
import type {
  BrandValues,
  CategoryValues,
  ColorValues,
  MaterialValues,
  ProductAttributeValues,
  ProductValues,
  SeasonValues,
  SizeValues,
} from '@/lib/schemas';

/* --------------------------------------------------------------- taxonomies */

export const categoriesService = createCrudService<Category, CategoryValues>({
  label: 'Category',
  collection: 'categories',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(c) => c.name, (c) => c.slug, (c) => c.description],
    filters: {
      is_active: (c, v) => String(c.is_active) === v,
      parent_id: (c, v) => (v === 'root' ? c.parent_id === null : String(c.parent_id) === v),
    },
    sorters: {
      name: (c) => c.name,
      sort_order: (c) => c.sort_order,
      created_at: (c) => c.created_at,
      is_active: (c) => c.is_active,
    },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    parent_id: input.parent_id,
    sort_order: input.sort_order,
    is_active: input.is_active,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
  beforeRemove: (row, db) => {
    if (db.categories.some((c) => c.parent_id === row.id)) {
      throw new ApiError('Move or delete the child categories first', 409);
    }
    if (db.products.some((p) => p.category_id === row.id)) {
      throw new ApiError('This category still has products assigned to it', 409);
    }
  },
});

export const brandsService = createCrudService<Brand, BrandValues>({
  label: 'Brand',
  collection: 'brands',
  allSort: (a, b) => a.name.localeCompare(b.name),
  query: {
    search: [(b) => b.name, (b) => b.country, (b) => b.contact_email],
    filters: {
      is_active: (b, v) => String(b.is_active) === v,
      is_featured: (b, v) => String(b.is_featured) === v,
      country: (b, v) => b.country === v,
    },
    sorters: {
      name: (b) => b.name,
      country: (b) => b.country,
      sort_order: (b) => b.sort_order,
      created_at: (b) => b.created_at,
    },
    defaultSort: { by: 'name', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    website: input.website,
    contact_email: input.contact_email,
    contact_phone: input.contact_phone,
    country: input.country,
    is_active: input.is_active,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
  beforeRemove: (row, db) => {
    if (db.products.some((p) => p.brand_id === row.id)) {
      throw new ApiError('This brand still has products assigned to it', 409);
    }
  },
});

export const colorsService = createCrudService<Color, ColorValues>({
  label: 'Colour',
  collection: 'colors',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(c) => c.name, (c) => c.family, (c) => c.hex_code],
    filters: {
      is_active: (c, v) => String(c.is_active) === v,
      family: (c, v) => c.family === v,
    },
    sorters: { name: (c) => c.name, family: (c) => c.family, sort_order: (c) => c.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    hex_code: input.hex_code,
    family: input.family,
    is_active: input.is_active,
    sort_order: input.sort_order,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
});

export const sizesService = createCrudService<Size, SizeValues>({
  label: 'Size',
  collection: 'sizes',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(s) => s.name, (s) => s.scale],
    filters: { is_active: (s, v) => String(s.is_active) === v, scale: (s, v) => s.scale === v },
    sorters: { name: (s) => s.name, scale: (s) => s.scale, sort_order: (s) => s.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    scale: input.scale,
    sort_order: input.sort_order,
    is_active: input.is_active,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
});

export const materialsService = createCrudService<Material, MaterialValues>({
  label: 'Material',
  collection: 'materials',
  allSort: (a, b) => a.name.localeCompare(b.name),
  query: {
    search: [(m) => m.name, (m) => m.category, (m) => m.description],
    filters: { is_active: (m, v) => String(m.is_active) === v, category: (m, v) => m.category === v },
    sorters: { name: (m) => m.name, category: (m) => m.category, sort_order: (m) => m.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    category: input.category,
    is_active: input.is_active,
    sort_order: input.sort_order,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
});

export const seasonsService = createCrudService<Season, SeasonValues>({
  label: 'Season',
  collection: 'seasons',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(s) => s.name, (s) => s.value],
    filters: { is_active: (s, v) => String(s.is_active) === v },
    sorters: { name: (s) => s.name, sort_order: (s) => s.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    value: input.value || slugify(input.name),
    sort_order: input.sort_order,
    is_active: input.is_active,
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
});

export const attributesService = createCrudService<ProductAttribute, ProductAttributeValues>({
  label: 'Attribute',
  collection: 'productAttributes',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(a) => a.name, (a) => a.slug, (a) => a.options.join(' ')],
    filters: {
      type: (a, v) => a.type === v,
      is_filterable: (a, v) => String(a.is_filterable) === v,
    },
    sorters: { name: (a) => a.name, type: (a) => a.type, sort_order: (a) => a.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    type: input.type,
    is_required: input.is_required,
    is_filterable: input.is_filterable,
    is_visible: input.is_visible,
    sort_order: input.sort_order,
    options: input.options
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    created_at: nowIso(),
    updated_at: nowIso(),
  }),
});

/* ----------------------------------------------------------------- products */

export function stockStatusFor(quantity: number, min: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= min) return 'low_stock';
  return 'in_stock';
}

function decorateProduct(product: Product): ProductListItem {
  const db = getDb();
  return {
    ...product,
    brand_name: db.brands.find((b) => b.id === product.brand_id)?.name ?? '—',
    category_name: db.categories.find((c) => c.id === product.category_id)?.name ?? '—',
    stock_status: stockStatusFor(product.quantity, product.min_quantity),
  };
}

function productFromInput(input: ProductValues, existing: Product | null): Product {
  const db = getDb();
  const images: ProductImage[] =
    existing?.images.length
      ? existing.images
      : [
          {
            id: 1,
            url: tileImage(input.name, 0),
            alt_text: `${input.name} — view 1`,
            is_primary: true,
            order: 0,
          },
          {
            id: 2,
            url: tileImage(input.name, 1),
            alt_text: `${input.name} — view 2`,
            is_primary: false,
            order: 1,
          },
        ];

  const variants: ProductVariant[] = input.variants.map((v, index) => ({
    id: v.id ?? index + 1,
    sku: v.sku,
    color_id: v.color_id,
    size_id: v.size_id,
    price_delta: v.price_delta,
    quantity: v.quantity,
    barcode: v.barcode,
  }));

  const quantity = variants.length
    ? variants.reduce((sum, v) => sum + v.quantity, 0)
    : (existing?.quantity ?? 0);

  return {
    id: existing?.id ?? nextId(db.products),
    name: input.name,
    slug: input.slug || slugify(input.name),
    sku: input.sku,
    brand_id: input.brand_id,
    category_id: input.category_id,
    material_id: input.material_id,
    season_id: input.season_id,
    description: input.description,
    short_description: input.short_description,
    price: input.price,
    sale_price: input.sale_price,
    compare_price: input.compare_price,
    cost_price: input.cost_price,
    quantity,
    min_quantity: input.min_quantity,
    weight: input.weight,
    barcode: input.barcode,
    model: input.model,
    images,
    variants,
    color_ids: input.color_ids,
    size_ids: input.size_ids,
    attributes: input.attributes,
    is_active: input.is_active,
    is_featured: input.is_featured,
    requires_shipping: input.requires_shipping,
    track_quantity: input.track_quantity,
    allow_backorder: input.allow_backorder,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
    sort_order: input.sort_order,
    published_at: existing?.published_at ?? nowIso(),
    rating: existing?.rating ?? 0,
    review_count: existing?.review_count ?? 0,
    units_sold: existing?.units_sold ?? 0,
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  };
}

export const productsService = {
  list(params: ListParams = {}): Promise<Paginated<ProductListItem>> {
    const rows = getDb().products.map(decorateProduct);
    return respond(
      runQuery(rows, params, {
        search: [(p) => p.name, (p) => p.sku, (p) => p.brand_name, (p) => p.model],
        filters: {
          category_id: (p, v) => String(p.category_id) === v,
          brand_id: (p, v) => String(p.brand_id) === v,
          season_id: (p, v) => String(p.season_id) === v,
          is_active: (p, v) => String(p.is_active) === v,
          is_featured: (p, v) => String(p.is_featured) === v,
          stock_status: (p, v) => p.stock_status === v,
        },
        sorters: {
          name: (p) => p.name,
          sku: (p) => p.sku,
          price: (p) => p.sale_price ?? p.price,
          quantity: (p) => p.quantity,
          units_sold: (p) => p.units_sold,
          rating: (p) => p.rating,
          created_at: (p) => p.created_at,
          category_name: (p) => p.category_name,
          brand_name: (p) => p.brand_name,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  all(): Promise<ProductListItem[]> {
    return respond(getDb().products.map(decorateProduct));
  },

  get(id: number): Promise<ProductListItem> {
    const product = getDb().products.find((p) => p.id === id);
    if (!product) notFound('Product', id);
    return respond(decorateProduct(product));
  },

  create(input: ProductValues): Promise<ProductListItem> {
    const db = getDb();
    if (db.products.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) {
      throw new ApiError(`SKU ${input.sku} is already in use`, 409);
    }
    const product = productFromInput(input, null);
    db.products.unshift(product);
    return respondAndCommit(decorateProduct(product));
  },

  update(id: number, input: ProductValues): Promise<ProductListItem> {
    const db = getDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) notFound('Product', id);
    const clash = db.products.find(
      (p) => p.id !== id && p.sku.toLowerCase() === input.sku.toLowerCase(),
    );
    if (clash) throw new ApiError(`SKU ${input.sku} is already used by ${clash.name}`, 409);
    const product = productFromInput(input, db.products[index]!);
    db.products[index] = product;
    return respondAndCommit(decorateProduct(product));
  },

  patch(id: number, changes: Partial<Product>): Promise<ProductListItem> {
    const db = getDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) notFound('Product', id);
    const product = { ...db.products[index]!, ...changes, id, updated_at: nowIso() };
    db.products[index] = product;
    return respondAndCommit(decorateProduct(product));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) notFound('Product', id);
    db.products.splice(index, 1);
    db.inventory = db.inventory.filter((row) => row.product_id !== id);
    db.reviews = db.reviews.filter((row) => row.product_id !== id);
    return respondAndCommit({ id });
  },

  /** Bulk activate/deactivate from the table's selection toolbar. */
  bulkSetActive(ids: number[], isActive: boolean): Promise<{ updated: number }> {
    const db = getDb();
    let updated = 0;
    for (const product of db.products) {
      if (!ids.includes(product.id)) continue;
      product.is_active = isActive;
      product.updated_at = nowIso();
      updated += 1;
    }
    return respondAndCommit({ updated });
  },

  bulkRemove(ids: number[]): Promise<{ removed: number }> {
    const db = getDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => !ids.includes(p.id));
    db.inventory = db.inventory.filter((row) => !ids.includes(row.product_id));
    return respondAndCommit({ removed: before - db.products.length });
  },
};

/* ------------------------------------------------------------------ reviews */

function decorateReview(review: Review): ReviewListItem {
  const db = getDb();
  const customer = db.customers.find((c) => c.id === review.customer_id);
  return {
    ...review,
    customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Guest shopper',
    product_name: db.products.find((p) => p.id === review.product_id)?.name ?? 'Removed product',
  };
}

export const reviewsService = {
  list(params: ListParams = {}): Promise<Paginated<ReviewListItem>> {
    const rows = getDb().reviews.map(decorateReview);
    return respond(
      runQuery(rows, params, {
        search: [(r) => r.title, (r) => r.comment, (r) => r.product_name, (r) => r.customer_name],
        filters: {
          is_approved: (r, v) => String(r.is_approved) === v,
          rating: (r, v) => String(r.rating) === v,
          product_id: (r, v) => String(r.product_id) === v,
        },
        sorters: {
          created_at: (r) => r.created_at,
          rating: (r) => r.rating,
          product_name: (r) => r.product_name,
          helpful_count: (r) => r.helpful_count,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  setApproval(id: number, isApproved: boolean): Promise<ReviewListItem> {
    const db = getDb();
    const review = db.reviews.find((r) => r.id === id);
    if (!review) notFound('Review', id);
    review.is_approved = isApproved;
    review.updated_at = nowIso();
    return respondAndCommit(decorateReview(review));
  },

  setFeatured(id: number, isFeatured: boolean): Promise<ReviewListItem> {
    const db = getDb();
    const review = db.reviews.find((r) => r.id === id);
    if (!review) notFound('Review', id);
    review.is_featured = isFeatured;
    review.updated_at = nowIso();
    return respondAndCommit(decorateReview(review));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.reviews.findIndex((r) => r.id === id);
    if (index === -1) notFound('Review', id);
    db.reviews.splice(index, 1);
    return respondAndCommit({ id });
  },
};
