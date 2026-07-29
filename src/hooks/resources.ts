/**
 * Query bindings for every flat resource. Each entry pairs a service with a
 * cache namespace and the toast copy for its mutations.
 */

import { createCrudHooks } from './use-crud';
import type { ProductListItem } from '@/types/domain';
import type { ProductValues } from '@/lib/schemas';
import { RESOURCES } from '@/lib/query-keys';
import {
  attributesService,
  brandsService,
  categoriesService,
  colorsService,
  materialsService,
  productsService,
  seasonsService,
  sizesService,
} from '@/services/catalog';
import { couponsService, subscribersService, testimonialsService } from '@/services/marketing';
import {
  aboutSectionsService,
  aboutStatsService,
  homeSectionsService,
  teamService,
} from '@/services/content';
import {
  adminUsersService,
  branchesService,
  currenciesService,
  warehousesService,
} from '@/services/settings';

export const productHooks = createCrudHooks<ProductListItem, ProductValues>(
  RESOURCES.products,
  productsService,
  {
    label: 'Product',
    alsoInvalidate: [RESOURCES.inventory],
  },
);

export const categoryHooks = createCrudHooks(RESOURCES.categories, categoriesService, {
  label: 'Category',
  alsoInvalidate: [RESOURCES.products],
});

export const brandHooks = createCrudHooks(RESOURCES.brands, brandsService, {
  label: 'Brand',
  alsoInvalidate: [RESOURCES.products],
});

export const colorHooks = createCrudHooks(RESOURCES.colors, colorsService, { label: 'Colour' });
export const sizeHooks = createCrudHooks(RESOURCES.sizes, sizesService, { label: 'Size' });
export const materialHooks = createCrudHooks(RESOURCES.materials, materialsService, {
  label: 'Material',
});
export const seasonHooks = createCrudHooks(RESOURCES.seasons, seasonsService, { label: 'Season' });
export const attributeHooks = createCrudHooks(RESOURCES.attributes, attributesService, {
  label: 'Attribute',
});

export const couponHooks = createCrudHooks(RESOURCES.coupons, couponsService, { label: 'Coupon' });
export const subscriberHooks = createCrudHooks(RESOURCES.subscribers, subscribersService, {
  label: 'Subscriber',
});
export const testimonialHooks = createCrudHooks(RESOURCES.testimonials, testimonialsService, {
  label: 'Testimonial',
});

export const teamHooks = createCrudHooks(RESOURCES.team, teamService, { label: 'Team member' });
export const homeSectionHooks = createCrudHooks(RESOURCES.homeSections, homeSectionsService, {
  label: 'Section',
});
export const aboutSectionHooks = createCrudHooks(RESOURCES.aboutSections, aboutSectionsService, {
  label: 'Section',
});
export const aboutStatHooks = createCrudHooks(RESOURCES.aboutStats, aboutStatsService, {
  label: 'Statistic',
});

export const currencyHooks = createCrudHooks(RESOURCES.currencies, currenciesService, {
  label: 'Currency',
});
export const warehouseHooks = createCrudHooks(RESOURCES.warehouses, warehousesService, {
  label: 'Warehouse',
  alsoInvalidate: [RESOURCES.inventory],
});
export const branchHooks = createCrudHooks(RESOURCES.branches, branchesService, {
  label: 'Branch',
  alsoInvalidate: [RESOURCES.inventory],
});
export const adminUserHooks = createCrudHooks(RESOURCES.users, adminUsersService, { label: 'User' });
