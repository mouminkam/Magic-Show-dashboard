import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Percent } from '@phosphor-icons/react';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { StatTile } from '@/components/ui/stat-tile';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ChartTooltip, axisProps, gridProps } from '@/components/charts/chart-parts';
import { couponAnalyticsService, couponState, type CouponState } from '@/services/marketing';
import { qk } from '@/lib/query-keys';
import { COUPON_TYPE_LABEL } from '@/lib/status';
import { formatDate, formatDateTime, formatMoney, formatMoneyShort } from '@/lib/format';
import { errorMessage } from '@/lib/utils';

const STATE_TONE: Record<CouponState, Tone> = {
  active: 'positive',
  scheduled: 'info',
  expired: 'neutral',
  exhausted: 'caution',
  disabled: 'neutral',
};

function monthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export default function CouponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const couponId = Number(id);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: qk.couponAnalytics(couponId),
    queryFn: () => couponAnalyticsService.get(couponId),
    enabled: Number.isFinite(couponId),
  });

  if (query.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Coupon not found"
        message={errorMessage(query.error, 'That coupon no longer exists.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { coupon, usages, total_discount, total_revenue, unique_customers, timeline } = query.data;
  const state = couponState(coupon);
  const limitProgress =
    coupon.usage_limit !== null && coupon.usage_limit > 0
      ? Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)
      : null;

  const chartData = timeline.map((entry) => ({
    label: monthLabel(entry.month),
    Redemptions: entry.redemptions,
    Discount: entry.discount,
  }));

  return (
    <div className="animate-in-up">
      <div className="mb-3 md:hidden">
        <Breadcrumbs currentLabel={coupon.code} />
      </div>

      <PageHeader
        title={coupon.code}
        description={`${coupon.name} · ${COUPON_TYPE_LABEL[coupon.type]}`}
        actions={
          <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate('/coupons')}>
            Back
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={STATE_TONE[state]} dot>
          {state}
        </Badge>
        <Badge tone="neutral">
          {coupon.type === 'free_shipping'
            ? 'Free shipping'
            : coupon.type === 'percentage'
              ? `${coupon.value}% off`
              : `${formatMoney(coupon.value)} off`}
        </Badge>
        <Badge tone="neutral">
          {formatDate(coupon.starts_at)} →{' '}
          {coupon.expires_at ? formatDate(coupon.expires_at) : 'no expiry'}
        </Badge>
        {coupon.is_public ? <Badge tone="info">Publicly listed</Badge> : null}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Redemptions" value={String(coupon.used_count)} icon={<Percent size={14} />} />
        <StatTile label="Unique customers" value={String(unique_customers)} />
        <StatTile label="Discount given" value={formatMoney(total_discount)} />
        <StatTile label="Revenue influenced" value={formatMoney(total_revenue)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Redemptions over time" description="Monthly usage and discount given." />
          <CardBody>
            {chartData.length === 0 ? (
              <EmptyState
                compact
                icon={<Percent size={18} />}
                title="Not redeemed yet"
                description="This coupon has no usage recorded in the demo dataset."
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} width={44} />
                  <Tooltip
                    cursor={{ fill: 'var(--chart-grid)' }}
                    content={<ChartTooltip />}
                  />
                  <Bar dataKey="Redemptions" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rules" />
          <CardBody>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Minimum basket</dt>
                <dd className="tnum text-ink">
                  {coupon.minimum_amount > 0 ? formatMoney(coupon.minimum_amount) : 'None'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Maximum discount</dt>
                <dd className="tnum text-ink">
                  {coupon.maximum_discount !== null ? formatMoney(coupon.maximum_discount) : 'Uncapped'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Per customer</dt>
                <dd className="tnum text-ink">{coupon.usage_limit_per_customer}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Total limit</dt>
                <dd className="tnum text-ink">{coupon.usage_limit ?? 'Unlimited'}</dd>
              </div>
            </dl>

            {limitProgress !== null ? (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-muted">Allocation used</span>
                  <span className="tnum text-ink">{limitProgress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${limitProgress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {coupon.terms_and_conditions ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-1 eyebrow">Terms</p>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  {coupon.terms_and_conditions}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Redemption log"
          description={`${usages.length} order${usages.length === 1 ? '' : 's'} used this code`}
        />
        {usages.length === 0 ? (
          <CardBody>
            <EmptyState compact title="No redemptions yet" />
          </CardBody>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-line bg-sunken/50">
                  <th scope="col" className="px-5 py-2.5 text-start eyebrow">
                    Order
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-start eyebrow">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-start eyebrow">
                    Used
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-end eyebrow">
                    Order total
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-end eyebrow">
                    Discount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usages.map((usage) => (
                  <tr
                    key={usage.id}
                    onClick={() => navigate(`/orders/${usage.order_id}`)}
                    className="cursor-pointer transition-colors hover:bg-sunken/70"
                  >
                    <td className="px-5 py-2.5 font-medium text-ink">{usage.order_number}</td>
                    <td className="px-5 py-2.5 text-muted">{usage.customer_name}</td>
                    <td className="px-5 py-2.5 text-muted">{formatDateTime(usage.used_at)}</td>
                    <td className="px-5 py-2.5 text-end tnum text-ink">
                      {formatMoneyShort(usage.order_total)}
                    </td>
                    <td className="px-5 py-2.5 text-end tnum text-positive">
                      −{formatMoney(usage.discount_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
