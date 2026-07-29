import {
  Article,
  Buildings,
  ChartPieSlice,
  ChatCircleDots,
  ChatsCircle,
  Compass,
  CurrencyCircleDollar,
  Drop,
  Envelope,
  Gauge,
  Gear,
  Package,
  Palette,
  Percent,
  Quotes,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkle,
  Stack,
  Star,
  Tag,
  UsersThree,
  Warehouse,
  type Icon,
} from '@phosphor-icons/react';

export interface NavItem {
  label: string;
  path: string;
  icon: Icon;
  /** Extra terms matched by the command palette. */
  keywords?: string[];
  /** Marks the route as an index route for `NavLink end`. */
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: Gauge, end: true, keywords: ['home', 'kpi', 'revenue'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', path: '/products', icon: Package, keywords: ['sku', 'stock', 'catalogue'] },
      { label: 'Categories', path: '/categories', icon: Stack, keywords: ['taxonomy', 'tree'] },
      { label: 'Brands', path: '/brands', icon: Sparkle, keywords: ['supplier', 'label'] },
      { label: 'Colours', path: '/colors', icon: Palette, keywords: ['color', 'swatch', 'hex'] },
      { label: 'Sizes', path: '/sizes', icon: Ruler, keywords: ['eu', 'uk', 'fit'] },
      { label: 'Materials', path: '/materials', icon: Drop, keywords: ['leather', 'suede', 'fabric'] },
      { label: 'Seasons', path: '/seasons', icon: Compass, keywords: ['ss25', 'aw25', 'collection'] },
      { label: 'Attributes', path: '/attributes', icon: SlidersHorizontal, keywords: ['filter', 'option'] },
      { label: 'Reviews', path: '/reviews', icon: Star, keywords: ['rating', 'moderation'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', path: '/orders', icon: ShoppingBag, keywords: ['sales', 'fulfilment', 'invoice'] },
      { label: 'Inventory', path: '/inventory', icon: Warehouse, keywords: ['stock', 'low stock', 'adjust'] },
      { label: 'Customers', path: '/customers', icon: UsersThree, keywords: ['shoppers', 'clients', 'crm'] },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Coupons', path: '/coupons', icon: Percent, keywords: ['discount', 'promo', 'voucher'] },
      { label: 'Newsletter', path: '/newsletter', icon: Envelope, keywords: ['subscribers', 'email list'] },
      { label: 'Testimonials', path: '/testimonials', icon: Quotes, keywords: ['quotes', 'social proof'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog posts', path: '/blog', icon: Article, keywords: ['journal', 'article'] },
      { label: 'Comments', path: '/comments', icon: ChatsCircle, keywords: ['moderation', 'approve'] },
      { label: 'Page content', path: '/pages', icon: ChartPieSlice, keywords: ['home', 'about', 'cms', 'hero'] },
      { label: 'Team', path: '/team', icon: UsersThree, keywords: ['staff', 'people', 'about'] },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Messages', path: '/messages', icon: ChatCircleDots, keywords: ['inbox', 'contact', 'enquiry'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'General', path: '/settings', icon: Gear, end: true, keywords: ['store', 'tax', 'shipping'] },
      { label: 'Currencies', path: '/settings/currencies', icon: CurrencyCircleDollar, keywords: ['fx', 'rate'] },
      { label: 'Warehouses', path: '/settings/warehouses', icon: Warehouse, keywords: ['location', 'depot'] },
      { label: 'Branches', path: '/settings/branches', icon: Buildings, keywords: ['store', 'retail'] },
      { label: 'Users', path: '/settings/users', icon: ShieldCheck, keywords: ['admin', 'staff', 'access'] },
      { label: 'Permissions', path: '/settings/permissions', icon: Tag, keywords: ['roles', 'acl'] },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Route path -> breadcrumb label, including detail routes. */
export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/products/new': 'New product',
  '/categories': 'Categories',
  '/brands': 'Brands',
  '/colors': 'Colours',
  '/sizes': 'Sizes',
  '/materials': 'Materials',
  '/seasons': 'Seasons',
  '/attributes': 'Attributes',
  '/reviews': 'Reviews',
  '/orders': 'Orders',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/coupons': 'Coupons',
  '/newsletter': 'Newsletter',
  '/testimonials': 'Testimonials',
  '/blog': 'Blog posts',
  '/blog/new': 'New post',
  '/comments': 'Comments',
  '/pages': 'Page content',
  '/team': 'Team',
  '/messages': 'Messages',
  '/settings': 'Settings',
  '/settings/currencies': 'Currencies',
  '/settings/warehouses': 'Warehouses',
  '/settings/branches': 'Branches',
  '/settings/users': 'Users',
  '/settings/permissions': 'Permissions',
};

/** Section a path belongs to, used as the first breadcrumb crumb. */
export function sectionFor(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))) {
      return group.label;
    }
  }
  return null;
}
