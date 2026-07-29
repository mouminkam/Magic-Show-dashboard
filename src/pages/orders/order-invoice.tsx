import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { LogoMark } from '@/components/layout/logo';
import { ordersService } from '@/services/orders';
import { storeSettingsService } from '@/services/settings';
import { qk } from '@/lib/query-keys';
import { formatDate, formatMoney } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/status';
import { errorMessage } from '@/lib/utils';

/**
 * Print-ready invoice. Everything outside the document is hidden by the
 * `print:hidden` utilities so Ctrl-P produces a clean single page.
 */
export default function OrderInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => ordersService.get(orderId),
    enabled: Number.isFinite(orderId),
  });

  const settingsQuery = useQuery({
    queryKey: qk.storeSettings(),
    queryFn: () => storeSettingsService.get(),
  });

  if (query.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-[36rem]" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Invoice unavailable"
        message={errorMessage(query.error, 'That order no longer exists.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const order = query.data;
  const store = settingsQuery.data;

  return (
    <div className="animate-in-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/orders/${order.id}`)}>
          Back to order
        </Button>
        <Button icon={<Printer size={15} />} onClick={() => window.print()}>
          Print invoice
        </Button>
      </div>

      <Card className="mx-auto max-w-3xl p-8 print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div>
              <p className="text-[16px] font-semibold text-ink">{store?.store_name ?? 'Magic Show'}</p>
              <p className="text-[12.5px] text-muted">{store?.tagline}</p>
              <p className="mt-1 text-[12px] text-faint">
                {store?.support_email} · {store?.support_phone}
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className="eyebrow">Tax invoice</p>
            <p className="text-[18px] font-semibold text-ink">{order.order_number}</p>
            <p className="text-[12.5px] text-muted">Issued {formatDate(order.created_at)}</p>
            <p className="mt-1 text-[12px] text-faint">
              {PAYMENT_STATUS_LABEL[order.payment_status]} ·{' '}
              {PAYMENT_METHOD_LABEL[order.payment_method]}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 eyebrow">Billed to</p>
            <address className="text-[13px] not-italic leading-relaxed text-ink">
              <span className="font-medium">{order.billing_address.name}</span>
              <br />
              {order.billing_address.line1}
              {order.billing_address.line2 ? (
                <>
                  <br />
                  {order.billing_address.line2}
                </>
              ) : null}
              <br />
              {order.billing_address.city}, {order.billing_address.state}
              <br />
              {order.billing_address.country} {order.billing_address.postal_code}
              <br />
              <span className="text-muted">{order.customer_email}</span>
            </address>
          </div>
          <div>
            <p className="mb-1.5 eyebrow">Shipped to</p>
            <address className="text-[13px] not-italic leading-relaxed text-ink">
              <span className="font-medium">{order.shipping_address.name}</span>
              <br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? (
                <>
                  <br />
                  {order.shipping_address.line2}
                </>
              ) : null}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state}
              <br />
              {order.shipping_address.country} {order.shipping_address.postal_code}
              <br />
              <span className="text-muted">{order.shipping_method}</span>
            </address>
          </div>
        </section>

        <table className="w-full border-collapse py-6 text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2.5 text-start eyebrow">
                Description
              </th>
              <th scope="col" className="py-2.5 text-end eyebrow">
                Unit
              </th>
              <th scope="col" className="py-2.5 text-end eyebrow">
                Qty
              </th>
              <th scope="col" className="py-2.5 text-end eyebrow">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p className="font-medium text-ink">{item.product_name}</p>
                  <p className="text-[12px] text-muted">
                    {item.product_sku} · {item.variant_label}
                  </p>
                </td>
                <td className="py-3 text-end tnum text-muted">{formatMoney(item.unit_price)}</td>
                <td className="py-3 text-end tnum text-ink">{item.quantity}</td>
                <td className="py-3 text-end tnum font-medium text-ink">
                  {formatMoney(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-line pt-5">
          <dl className="w-full max-w-xs space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tnum text-ink">{formatMoney(order.subtotal)}</dd>
            </div>
            {order.discount_amount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}
                </dt>
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
              <dt className="text-muted">VAT ({store?.tax_rate ?? 5}%)</dt>
              <dd className="tnum text-ink">{formatMoney(order.tax_amount)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
              <dt className="text-ink">Total due</dt>
              <dd className="tnum text-ink">{formatMoney(order.total_amount)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 border-t border-line pt-5 text-[12px] leading-relaxed text-muted">
          <p>
            Returns accepted within 30 days on unworn items with the original box. Welted styles are
            covered by the Magic Show resole programme for the life of the upper.
          </p>
          <p className="mt-2 text-faint">
            This is a demo document generated from mock data — no goods were sold.
          </p>
        </footer>
      </Card>
    </div>
  );
}
