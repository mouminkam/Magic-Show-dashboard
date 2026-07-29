import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChatCircleDots,
  ChatsCircle,
  CurrencyCircleDollar,
  Package,
  ShoppingBag,
  Star,
  UsersThree,
  Warning,
} from '@phosphor-icons/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { axisProps, ChartLegend, ChartTooltip, CHART_COLORS, gridProps } from '@/components/charts/chart-parts';
import { dashboardService, type DashboardRange } from '@/services/dashboard';
import { qk } from '@/lib/query-keys';
import { formatCompact, formatDate, formatMoney, formatMoneyShort, formatNumber } from '@/lib/format';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, STOCK_STATUS_LABEL, STOCK_STATUS_TONE } from '@/lib/status';
import { errorMessage } from '@/lib/utils';

const RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<DashboardRange>(30);

  const query = useQuery({
    queryKey: qk.dashboard(range),
    queryFn: () => dashboardService.summary(range),
    placeholderData: (previous) => previous,
  });

  const data = query.data;

  if (query.isError) {
    return (
      <div className="animate-in-up">
        <ErrorState message={errorMessage(query.error, 'Could not load the dashboard')} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-in-up">
      <PageHeader
        title="Dashboard"
        description="Store performance at a glance."
        actions={
          <Select
            size="sm"
            value={String(range)}
            onValueChange={(value) => setRange(Number(value) as DashboardRange)}
            options={RANGE_OPTIONS}
            className="w-44"
            aria-label="Date range"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenue"
          value={data ? formatMoneyShort(data.revenue.value) : '—'}
          changePct={data?.revenue.change_pct}
          loading={query.isLoading}
          icon={<CurrencyCircleDollar size={15} />}
        />
        <StatTile
          label="Orders"
          value={data ? formatNumber(data.orders.value) : '—'}
          changePct={data?.orders.change_pct}
          loading={query.isLoading}
          icon={<ShoppingBag size={15} />}
        />
        <StatTile
          label="Average order value"
          value={data ? formatMoney(data.average_order_value.value) : '—'}
          changePct={data?.average_order_value.change_pct}
          loading={query.isLoading}
          icon={<Package size={15} />}
        />
        <StatTile
          label="New customers"
          value={data ? formatNumber(data.new_customers.value) : '—'}
          changePct={data?.new_customers.change_pct}
          loading={query.isLoading}
          icon={<UsersThree size={15} />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue over time" description="Revenue and order volume for the selected range." />
          <CardBody>
            {query.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.revenue_series ?? []} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={(v: string) => formatDate(v)} minTickGap={32} />
                    <YAxis {...axisProps} tickFormatter={(v: number) => formatCompact(v)} width={44} />
                    <Tooltip
                      content={
                        <ChartTooltip format={(v) => formatMoney(v)} labelFormat={(l) => formatDate(l)} />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="var(--chart-1)"
                      fill="url(#revenueFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Orders by status" description="Volume within the selected range." />
          <CardBody>
            {query.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : data && data.status_breakdown.length > 0 ? (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.status_breakdown}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {data.status_breakdown.map((entry, index) => (
                          <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip format={(v) => formatNumber(v)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2">
                  <ChartLegend
                    items={data.status_breakdown.map((entry, index) => ({
                      label: ORDER_STATUS_LABEL[entry.status],
                      color: CHART_COLORS[index % CHART_COLORS.length]!,
                      value: entry.count,
                    }))}
                  />
                </div>
              </>
            ) : (
              <p className="py-16 text-center text-[13px] text-muted">No orders in this range.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            actions={
              <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate('/orders')}>
                View all
              </Button>
            }
          />
          <div className="divide-y divide-line">
            {query.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data && data.recent_orders.length > 0 ? (
              data.recent_orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-start transition-colors hover:bg-sunken"
                >
                  <Avatar name={order.customer_name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{order.order_number}</p>
                    <p className="truncate text-[12px] text-muted">{order.customer_name}</p>
                  </div>
                  <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                  <span className="w-20 shrink-0 text-end tnum text-[13px] font-medium text-ink">
                    {formatMoney(order.total_amount)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-5 py-10 text-center text-[13px] text-muted">No orders yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs attention" description="Queued work across the store." />
          <CardBody className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="flex w-full items-center gap-2.5 rounded-md border border-line px-3 py-2.5 text-start transition-colors hover:bg-sunken"
            >
              <ChatCircleDots size={16} className="shrink-0 text-muted" aria-hidden />
              <span className="flex-1 text-[13px] text-ink">Unread messages</span>
              <Badge tone={data?.pending_actions.unread_messages ? 'brand' : 'neutral'}>
                {query.isLoading ? '…' : (data?.pending_actions.unread_messages ?? 0)}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => navigate('/comments')}
              className="flex w-full items-center gap-2.5 rounded-md border border-line px-3 py-2.5 text-start transition-colors hover:bg-sunken"
            >
              <ChatsCircle size={16} className="shrink-0 text-muted" aria-hidden />
              <span className="flex-1 text-[13px] text-ink">Comments awaiting review</span>
              <Badge tone={data?.pending_actions.pending_comments ? 'caution' : 'neutral'}>
                {query.isLoading ? '…' : (data?.pending_actions.pending_comments ?? 0)}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => navigate('/reviews')}
              className="flex w-full items-center gap-2.5 rounded-md border border-line px-3 py-2.5 text-start transition-colors hover:bg-sunken"
            >
              <Star size={16} className="shrink-0 text-muted" aria-hidden />
              <span className="flex-1 text-[13px] text-ink">Reviews awaiting approval</span>
              <Badge tone={data?.pending_actions.pending_reviews ? 'caution' : 'neutral'}>
                {query.isLoading ? '…' : (data?.pending_actions.pending_reviews ?? 0)}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="flex w-full items-center gap-2.5 rounded-md border border-line px-3 py-2.5 text-start transition-colors hover:bg-sunken"
            >
              <ShoppingBag size={16} className="shrink-0 text-muted" aria-hidden />
              <span className="flex-1 text-[13px] text-ink">Orders awaiting confirmation</span>
              <Badge tone={data?.pending_actions.orders_awaiting ? 'info' : 'neutral'}>
                {query.isLoading ? '…' : (data?.pending_actions.orders_awaiting ?? 0)}
              </Badge>
            </button>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Top products" description="Best sellers by revenue in the selected range." />
          <CardBody>
            {query.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data && data.top_products.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.top_products}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid {...gridProps} horizontal={false} />
                    <XAxis type="number" {...axisProps} tickFormatter={(v: number) => formatCompact(v)} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      {...axisProps}
                      width={140}
                      tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 20)}…` : v)}
                    />
                    <Tooltip content={<ChartTooltip format={(v) => formatMoney(v)} />} />
                    <Bar dataKey="revenue" name="Revenue" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-[13px] text-muted">No sales in this range.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Low stock alerts"
            actions={
              <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate('/inventory')}>
                Manage
              </Button>
            }
          />
          <div className="divide-y divide-line">
            {query.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : data && data.low_stock.length > 0 ? (
              data.low_stock.map((row) => (
                <div key={row.id} className="flex items-center gap-2.5 px-5 py-3">
                  <Warning size={16} className="shrink-0 text-caution" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{row.product_name}</p>
                    <p className="truncate text-[11.5px] text-muted">{row.location_name}</p>
                  </div>
                  <Badge tone={STOCK_STATUS_TONE[row.stock_status]}>{STOCK_STATUS_LABEL[row.stock_status]}</Badge>
                </div>
              ))
            ) : (
              <p className="px-5 py-10 text-center text-[13px] text-muted">Stock levels look healthy.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
