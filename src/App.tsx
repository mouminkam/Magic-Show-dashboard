import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/auth/protected-route';

const LoginPage = lazy(() => import('@/pages/auth/login'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));

const ProductListPage = lazy(() => import('@/pages/catalog/product-list'));
const ProductEditorPage = lazy(() => import('@/pages/catalog/product-editor'));
const CategoriesPage = lazy(() => import('@/pages/catalog/categories'));
const BrandsPage = lazy(() => import('@/pages/catalog/brands'));
const ColorsPage = lazy(() => import('@/pages/catalog/colors'));
const SizesPage = lazy(() => import('@/pages/catalog/sizes'));
const MaterialsPage = lazy(() => import('@/pages/catalog/materials'));
const SeasonsPage = lazy(() => import('@/pages/catalog/seasons'));
const AttributesPage = lazy(() => import('@/pages/catalog/attributes'));
const ReviewsPage = lazy(() => import('@/pages/catalog/reviews'));

const OrderListPage = lazy(() => import('@/pages/orders/order-list'));
const OrderDetailPage = lazy(() => import('@/pages/orders/order-detail'));
const OrderInvoicePage = lazy(() => import('@/pages/orders/order-invoice'));

const InventoryPage = lazy(() => import('@/pages/inventory/inventory'));

const CustomerListPage = lazy(() => import('@/pages/customers/customer-list'));
const CustomerDetailPage = lazy(() => import('@/pages/customers/customer-detail'));

const CouponsPage = lazy(() => import('@/pages/marketing/coupons'));
const CouponDetailPage = lazy(() => import('@/pages/marketing/coupon-detail'));
const NewsletterPage = lazy(() => import('@/pages/marketing/newsletter'));
const TestimonialsPage = lazy(() => import('@/pages/marketing/testimonials'));

const BlogListPage = lazy(() => import('@/pages/content/blog-list'));
const BlogEditorPage = lazy(() => import('@/pages/content/blog-editor'));
const CommentsPage = lazy(() => import('@/pages/content/comments'));
const PageContentPage = lazy(() => import('@/pages/content/page-content'));
const TeamPage = lazy(() => import('@/pages/content/team'));

const MessagesPage = lazy(() => import('@/pages/support/messages'));

const GeneralSettingsPage = lazy(() => import('@/pages/settings/general'));
const CurrenciesPage = lazy(() => import('@/pages/settings/currencies'));
const WarehousesPage = lazy(() => import('@/pages/settings/warehouses'));
const BranchesPage = lazy(() => import('@/pages/settings/branches'));
const UsersPage = lazy(() => import('@/pages/settings/users'));
const PermissionsPage = lazy(() => import('@/pages/settings/permissions'));

const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage }))
);

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />

              <Route path="products" element={<ProductListPage />} />
              <Route path="products/new" element={<ProductEditorPage />} />
              <Route path="products/:id" element={<ProductEditorPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="colors" element={<ColorsPage />} />
              <Route path="sizes" element={<SizesPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="seasons" element={<SeasonsPage />} />
              <Route path="attributes" element={<AttributesPage />} />
              <Route path="reviews" element={<ReviewsPage />} />

              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/:id/invoice" element={<OrderInvoicePage />} />

              <Route path="inventory" element={<InventoryPage />} />

              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />

              <Route path="coupons" element={<CouponsPage />} />
              <Route path="coupons/:id" element={<CouponDetailPage />} />
              <Route path="newsletter" element={<NewsletterPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />

              <Route path="blog" element={<BlogListPage />} />
              <Route path="blog/new" element={<BlogEditorPage />} />
              <Route path="blog/:id" element={<BlogEditorPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="pages" element={<PageContentPage />} />
              <Route path="team" element={<TeamPage />} />

              <Route path="messages" element={<MessagesPage />} />

              <Route path="settings" element={<GeneralSettingsPage />} />
              <Route path="settings/currencies" element={<CurrenciesPage />} />
              <Route path="settings/warehouses" element={<WarehousesPage />} />
              <Route path="settings/branches" element={<BranchesPage />} />
              <Route path="settings/users" element={<UsersPage />} />
              <Route path="settings/permissions" element={<PermissionsPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
