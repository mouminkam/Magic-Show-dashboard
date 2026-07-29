import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FloppyDisk,
  MapPin,
  Receipt,
  Truck,
  User,
} from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { SelectField, TextField, TextareaField } from '@/components/resource/form-controls';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ordersService } from '@/services/orders';
import { qk } from '@/lib/query-keys';
import { orderUpdateSchema, type OrderUpdateValues } from '@/lib/schemas';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import { PAYMENT_STATUSES, type Address, type OrderStatus } from '@/types/domain';

function AddressBlock({ title, address, icon }: { title: string; address: Address; icon: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 eyebrow">
        <span aria-hidden>{icon}</span>
        {title}
      </p>
      <address className="text-[13px] not-italic leading-relaxed text-ink">
        <span className="font-medium">{address.name}</span>
        <br />
        {address.line1}
        {address.line2 ? (
          <>
            <br />
            {address.line2}
          </>
        ) : null}
        <br />
        {address.city}, {address.state}
        <br />
        {address.country} {address.postal_code}
        <br />
        <span className="text-muted">{address.phone}</span>
      </address>
    </div>
  );
}

/** Ordered fulfilment milestones with their timestamps. */
function Timeline({
  entries,
}: {
  entries: { label: string; at: string | null; done: boolean }[];
}) {
  return (
    <ol className="relative space-y-4 ps-5">
      <span className="absolute inset-y-1 start-[5px] w-px bg-line" aria-hidden />
      {entries.map((entry) => (
        <li key={entry.label} className="relative">
          <span
            className={`absolute -start-5 top-1 flex h-[11px] w-[11px] items-center justify-center rounded-full ring-2 ring-surface ${
              entry.done ? 'bg-brand' : 'bg-line-strong'
            }`}
            aria-hidden
          />
          <p className={`text-[13px] font-medium ${entry.done ? 'text-ink' : 'text-faint'}`}>
            {entry.label}
          </p>
          <p className="text-[12px] text-muted">{entry.at ? formatDateTime(entry.at) : 'Not yet'}</p>
        </li>
      ))}
    </ol>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => ordersService.get(orderId),
    enabled: Number.isFinite(orderId),
  });

  const order = query.data;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('orders') });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: qk.resource('customers') });
  };

  const transitionMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersService.transition(orderId, status),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`Order moved to ${ORDER_STATUS_LABEL[updated.status].toLowerCase()}`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update that order')),
  });

  const updateMutation = useMutation({
    mutationFn: (values: OrderUpdateValues) => ordersService.update(orderId, values),
    onSuccess: () => {
      invalidate();
      toast.success('Order details saved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the order')),
  });

  const form = useForm<OrderUpdateValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: 'pending',
      payment_status: 'pending',
      tracking_number: '',
      shipping_method: '',
      admin_notes: '',
    },
  });

  useEffect(() => {
    if (!order) return;
    form.reset({
      status: order.status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number,
      shipping_method: order.shipping_method,
      admin_notes: order.admin_notes,
    });
  }, [order, form]);

  const nextStatuses = useMemo(
    () => (order ? ORDER_STATUS_TRANSITIONS[order.status] : []),
    [order],
  );

  if (query.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (query.isError || !order) {
    return (
      <div className="animate-in-up">
        <ErrorState
          title="Order not found"
          message={errorMessage(query.error, 'That order no longer exists in the demo store.')}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="animate-in-up">
      <div className="mb-3 md:hidden">
        <Breadcrumbs currentLabel={order.order_number} />
      </div>

      <PageHeader
        title={order.order_number}
        description={`Placed ${formatDateTime(order.created_at)} · ${order.shipping_method}`}
        actions={
          <>
            <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate('/orders')}>
              Back
            </Button>
            <Button
              variant="outline"
              icon={<Receipt size={15} />}
              onClick={() => navigate(`/orders/${order.id}/invoice`)}
            >
              Invoice
            </Button>
            {nextStatuses.map((status) => (
              <Button
                key={status}
                icon={status === 'cancelled' ? undefined : <ArrowRight size={15} />}
                variant={status === 'cancelled' ? 'outline' : 'primary'}
                loading={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate(status)}
              >
                Mark {ORDER_STATUS_LABEL[status].toLowerCase()}
              </Button>
            ))}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
        <Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>
          {PAYMENT_STATUS_LABEL[order.payment_status]}
        </Badge>
        <Badge tone="neutral">{PAYMENT_METHOD_LABEL[order.payment_method]}</Badge>
        {order.coupon_code ? <Badge tone="brand">Coupon {order.coupon_code}</Badge> : null}
        {order.tracking_number ? (
          <Badge tone="info">
            <Truck size={12} aria-hidden /> {order.tracking_number}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Line items" description={`${order.item_count} units in this order`} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-y border-line bg-sunken/50">
                    <th scope="col" className="px-5 py-2.5 text-start text-[11px] uppercase tracking-[0.06em] text-faint">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-end text-[11px] uppercase tracking-[0.06em] text-faint">
                      Unit
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-end text-[11px] uppercase tracking-[0.06em] text-faint">
                      Qty
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-end text-[11px] uppercase tracking-[0.06em] text-faint">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={item.image_url} name={item.product_name} size={36} rounded="md" />
                          <div className="min-w-0">
                            <Link
                              to={`/products/${item.product_id}`}
                              className="truncate font-medium text-ink hover:text-brand hover:underline"
                            >
                              {item.product_name}
                            </Link>
                            <p className="truncate text-[12px] text-muted">
                              {item.product_sku} · {item.variant_label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-end tnum text-muted">{formatMoney(item.unit_price)}</td>
                      <td className="px-3 py-3 text-end tnum text-ink">{item.quantity}</td>
                      <td className="px-5 py-3 text-end tnum font-medium text-ink">
                        {formatMoney(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line px-5 py-4">
              <dl className="ms-auto max-w-xs space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tnum text-ink">{formatMoney(order.subtotal)}</dd>
                </div>
                {order.discount_amount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted">Discount</dt>
                    <dd className="tnum text-positive">−{formatMoney(order.discount_amount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tnum text-ink">
                    {order.shipping_amount === 0 ? 'Free' : formatMoney(order.shipping_amount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">VAT (5%)</dt>
                  <dd className="tnum text-ink">{formatMoney(order.tax_amount)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5 text-[14.5px] font-semibold">
                  <dt className="text-ink">Total</dt>
                  <dd className="tnum text-ink">{formatMoney(order.total_amount)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Fulfilment" description="Update the workflow, courier reference and internal notes." />
            <CardBody>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit((values) => updateMutation.mutate(values))(event);
                }}
                noValidate
              >
                <FieldGrid>
                  <SelectField
                    form={form}
                    name="status"
                    label="Order status"
                    options={[
                      { value: order.status, label: `${ORDER_STATUS_LABEL[order.status]} (current)` },
                      ...nextStatuses.map((status) => ({
                        value: status,
                        label: ORDER_STATUS_LABEL[status],
                      })),
                    ]}
                    hint={
                      nextStatuses.length === 0
                        ? 'This order has reached a terminal status.'
                        : 'Only valid next steps are listed.'
                    }
                  />
                  <SelectField
                    form={form}
                    name="payment_status"
                    label="Payment status"
                    options={PAYMENT_STATUSES.map((status) => ({
                      value: status,
                      label: PAYMENT_STATUS_LABEL[status],
                    }))}
                  />
                  <TextField form={form} name="shipping_method" label="Shipping method" />
                  <TextField form={form} name="tracking_number" label="Tracking number" />
                  <FieldSpan>
                    <TextareaField
                      form={form}
                      name="admin_notes"
                      label="Internal notes"
                      rows={3}
                      hint="Never shown to the customer."
                    />
                  </FieldSpan>
                </FieldGrid>
                <div className="mt-4 flex justify-end">
                  <Button type="submit" loading={updateMutation.isPending} icon={<FloppyDisk size={15} />}>
                    Save fulfilment
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Customer"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<User size={14} />}
                  onClick={() => navigate(`/customers/${order.customer_id}`)}
                >
                  Profile
                </Button>
              }
            />
            <CardBody>
              <div className="flex items-center gap-2.5">
                <Avatar name={order.customer_name} size={38} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{order.customer_name}</p>
                  <p className="truncate text-[12.5px] text-muted">{order.customer_email}</p>
                </div>
              </div>
              {order.customer_notes ? (
                <div className="mt-3 rounded-md border border-line bg-sunken/60 p-3">
                  <p className="mb-1 eyebrow">Customer note</p>
                  <p className="text-[13px] leading-relaxed text-ink">{order.customer_notes}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Addresses" />
            <CardBody className="space-y-4">
              <AddressBlock title="Shipping" address={order.shipping_address} icon={<Truck size={12} />} />
              <div className="h-px bg-line" />
              <AddressBlock title="Billing" address={order.billing_address} icon={<MapPin size={12} />} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <Timeline
                entries={[
                  { label: 'Order placed', at: order.created_at, done: true },
                  { label: 'Confirmed', at: order.confirmed_at, done: order.confirmed_at !== null },
                  { label: 'Shipped', at: order.shipped_at, done: order.shipped_at !== null },
                  { label: 'Delivered', at: order.delivered_at, done: order.delivered_at !== null },
                  ...(order.cancelled_at
                    ? [{ label: 'Cancelled', at: order.cancelled_at, done: true }]
                    : []),
                ]}
              />
              {order.status === 'delivered' ? (
                <p className="mt-4 flex items-center gap-1.5 rounded-md bg-positive-soft px-2.5 py-2 text-[12.5px] text-positive">
                  <CheckCircle size={14} weight="fill" aria-hidden />
                  Fulfilled in full.
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
