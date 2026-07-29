import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, EnvelopeSimple, Phone, ShoppingBag } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { StatTile } from '@/components/ui/stat-tile';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { customersService } from '@/services/customers';
import { ordersService } from '@/services/orders';
import { qk } from '@/lib/query-keys';
import { formatDate, formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL } from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import { avatarImage } from '@/mocks/imagery';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();

  const customerQuery = useQuery({
    queryKey: qk.detail('customers', customerId),
    queryFn: () => customersService.get(customerId),
    enabled: Number.isFinite(customerId),
  });

  const ordersQuery = useQuery({
    queryKey: qk.customerOrders(customerId),
    queryFn: () => ordersService.forCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  if (customerQuery.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <ErrorState
        title="Customer not found"
        message={errorMessage(customerQuery.error, 'That customer no longer exists.')}
        onRetry={() => void customerQuery.refetch()}
      />
    );
  }

  const customer = customerQuery.data;
  const orders = ordersQuery.data ?? [];
  const averageOrder = customer.orders_count > 0 ? customer.total_spent / customer.orders_count : 0;

  return (
    <div className="animate-in-up">
      <div className="mb-3 md:hidden">
        <Breadcrumbs currentLabel={customer.full_name} />
      </div>

      <PageHeader
        title={customer.full_name}
        description={`Customer since ${formatDate(customer.created_at)} · ${customer.city}, ${customer.country}`}
        actions={
          <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate('/customers')}>
            Back
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Lifetime value" value={formatMoney(customer.total_spent)} />
        <StatTile label="Orders" value={String(customer.orders_count)} />
        <StatTile label="Average order" value={formatMoney(averageOrder)} />
        <StatTile
          label="Last order"
          value={customer.last_order_at ? formatRelative(customer.last_order_at) : 'Never'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Profile" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar src={avatarImage(customer.full_name)} name={customer.full_name} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{customer.full_name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={customer.is_active ? 'positive' : 'neutral'} dot>
                      {customer.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                    {customer.email_verified ? <Badge tone="info">Verified</Badge> : null}
                  </div>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex items-start gap-2">
                  <EnvelopeSimple size={15} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                  <div className="min-w-0">
                    <dt className="sr-only">Email</dt>
                    <dd className="truncate text-ink">{customer.email}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={15} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                  <div className="min-w-0">
                    <dt className="sr-only">Phone</dt>
                    <dd className="truncate text-ink">{customer.phone || '—'}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-1.5 eyebrow">Address</p>
                <address className="text-[13px] not-italic leading-relaxed text-ink">
                  {customer.address || '—'}
                  <br />
                  {customer.city}, {customer.state}
                  <br />
                  {customer.country} {customer.postal_code}
                </address>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[13px]">
                <div>
                  <p className="eyebrow">Language</p>
                  <p className="mt-0.5 text-ink">
                    {customer.preferred_language === 'ar' ? 'Arabic' : 'English'}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Currency</p>
                  <p className="mt-0.5 text-ink">{customer.preferred_currency}</p>
                </div>
                <div>
                  <p className="eyebrow">Marketing</p>
                  <p className="mt-0.5 text-ink">
                    {customer.marketing_opt_in ? 'Opted in' : 'Not opted in'}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Last login</p>
                  <p className="mt-0.5 text-ink">
                    {customer.last_login_at ? formatRelative(customer.last_login_at) : '—'}
                  </p>
                </div>
              </div>

              {customer.notes ? (
                <div className="mt-4 rounded-md border border-line bg-sunken/60 p-3">
                  <p className="mb-1 eyebrow">Internal note</p>
                  <p className="text-[13px] leading-relaxed text-ink">{customer.notes}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Order history"
              description={`${orders.length} order${orders.length === 1 ? '' : 's'} on record`}
            />
            {ordersQuery.isLoading ? (
              <CardBody className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </CardBody>
            ) : orders.length === 0 ? (
              <CardBody>
                <EmptyState
                  compact
                  icon={<ShoppingBag size={18} />}
                  title="No orders yet"
                  description="This customer has registered but has not placed an order."
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-start transition-colors hover:bg-sunken/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{order.order_number}</p>
                      <p className="truncate text-[12px] text-muted">
                        {formatDateTime(order.created_at)} · {order.item_count} item
                        {order.item_count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                    <span className="hidden text-[12px] text-muted sm:inline">
                      {PAYMENT_STATUS_LABEL[order.payment_status]}
                    </span>
                    <span className="w-24 text-end tnum font-medium text-ink">
                      {formatMoney(order.total_amount)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
