import { Link } from 'react-router-dom';
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
import {
  ArrowUpRight,
  Clock3,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/order/StatusBadge';
import { AdminHeader, Panel, StatCard, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { formatCompact, formatDate, formatPKR } from '../../lib/format';
import { STATUS_META } from '../../lib/orders';

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#0EA5E9',
  preparing: '#F97316',
  ready: '#8B5CF6',
  out_for_delivery: '#6366F1',
  delivered: '#10B981',
  cancelled: '#F43F5E',
};

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(20,16,14,0.08)',
  boxShadow: '0 12px 30px -18px rgba(20,16,14,0.4)',
  fontSize: 12,
  fontWeight: 600,
};

function ChartSkeleton({ className = 'h-64' }) {
  return <div className={`skeleton w-full ${className}`} />;
}

export default function AdminDashboard() {
  usePageTitle('Admin overview');
  const { data, loading, error, reload } = useFetch('/admin/stats');
  const kpis = data?.kpis;
  const daily = data?.daily || [];
  const weekly = data?.weekly || [];
  const monthly = data?.monthly || [];
  const popular = data?.popularProducts || [];
  const recent = data?.recentOrders || [];
  const statusBreakdown = (data?.statusBreakdown || []).filter((entry) => entry.count > 0);
  const totalStatusOrders = statusBreakdown.reduce((sum, entry) => sum + entry.count, 0);
  const maxPopular = Math.max(1, ...popular.map((entry) => entry.quantity));

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="font-display text-base font-bold text-rose-800">We couldn’t load the dashboard</p>
        <p className="mt-1 text-xs text-rose-600">{error}</p>
        <Button onClick={reload} size="sm" className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        eyebrow="Live overview"
        title="Good to see you again"
        description="A real-time snapshot of orders, revenue and the dishes Lahore is loving today."
      >
        <Button to="/admin/orders" size="sm" variant="outline">
          Manage orders
        </Button>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
        >
          Add a product <ArrowUpRight size={14} />
        </Link>
      </AdminHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-28 w-full" />)
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Total revenue"
              value={formatPKR(kpis.revenue)}
              hint={`${formatPKR(kpis.averageOrderValue)} average order`}
              accent="brand"
            />
            <StatCard
              icon={ShoppingBag}
              label="Total orders"
              value={kpis.totalOrders.toLocaleString('en-PK')}
              hint={`${kpis.deliveredOrders} delivered · ${kpis.pendingOrders} active`}
              accent="accent"
            />
            <StatCard
              icon={Users}
              label="Customers"
              value={kpis.totalCustomers.toLocaleString('en-PK')}
              hint="Registered customer accounts"
              accent="emerald"
            />
            <StatCard
              icon={Package}
              label="Products live"
              value={kpis.totalProducts.toLocaleString('en-PK')}
              hint={`${kpis.todayOrders} orders · ${formatPKR(kpis.todayRevenue)} today`}
              accent="violet"
            />
          </>
        )}
      </div>

      {(kpis?.pendingOrders > 0 || kpis?.todayOrders > 0) && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-accent-900">
            <Clock3 size={15} />
            {kpis.pendingOrders} order{kpis.pendingOrders === 1 ? '' : 's'} in progress · {kpis.todayOrders} placed today
          </p>
          <Link to="/admin/orders?status=pending" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-800 hover:text-accent-900">
            Open kitchen queue <ArrowUpRight size={13} />
          </Link>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Revenue trend"
          description="Last 14 days of paid and delivered sales"
          actions={
            <span className="chip bg-emerald-50 text-[10px] text-emerald-700">
              <TrendingUp size={12} /> {formatPKR(daily.reduce((sum, day) => sum + day.revenue, 0))} in period
            </span>
          }
        >
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C81E2E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C81E2E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(20,16,14,0.07)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94847A' }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94847A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatPKR(value), 'Revenue']}
                    labelStyle={{ color: '#14100E', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C81E2E" strokeWidth={2.5} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Orders by status" description="Every order ever placed">
          {loading ? (
            <ChartSkeleton className="h-56" />
          ) : statusBreakdown.length === 0 ? (
            <p className="py-12 text-center text-xs text-ink-400">No orders yet.</p>
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={52} outerRadius={76} paddingAngle={3}>
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [value, STATUS_META[name]?.label || name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
                {statusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} />
                      {STATUS_META[entry.status]?.label || entry.status}
                    </span>
                    <span className="text-[10px] font-bold text-ink-700">
                      {Math.round((entry.count / totalStatusOrders) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Weekly sales" description="Last 8 weeks">
          {loading ? (
            <ChartSkeleton className="h-52" />
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(20,16,14,0.07)" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94847A' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94847A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatPKR(value), 'Revenue']} cursor={{ fill: 'rgba(200,30,46,0.05)' }} />
                  <Bar dataKey="revenue" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Monthly performance" description="Revenue over the last 6 months">
          {loading ? (
            <ChartSkeleton className="h-52" />
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14100E" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#14100E" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(20,16,14,0.07)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94847A' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94847A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatPKR(value), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#14100E" strokeWidth={2.5} fill="url(#monthFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Popular products" description="Last 30 days by quantity sold">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : popular.length === 0 ? (
            <p className="py-10 text-center text-xs text-ink-400">No sales data yet.</p>
          ) : (
            <ol className="space-y-3">
              {popular.map((entry, index) => (
                <li key={entry._id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-ink-700">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-cream-100 text-[9px] font-bold text-ink-500">
                        {index + 1}
                      </span>
                      <span className="truncate">{entry._id}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-ink-500">{entry.quantity} sold</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                      style={{ width: `${(entry.quantity / maxPopular) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-[9px] font-medium text-ink-400">{formatPKR(entry.revenue)}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          title="Recent orders"
          description="The latest activity from the kitchen"
          actions={
            <Link to="/admin/orders" className="text-[11px] font-bold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          }
          bodyClassName="p-0"
        >
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : (
            <TableShell className="rounded-none border-0 shadow-none">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Placed</Th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <TableEmpty colSpan={5} title="No orders yet" description="New orders will show up here instantly." />
                ) : (
                  recent.map((order) => (
                    <tr key={order._id} className="transition hover:bg-cream-50/60">
                      <Td>
                        <Link to={`/admin/orders/${order._id}`} className="font-mono text-[11px] font-bold text-ink-900 hover:text-brand-600">
                          {order.orderNumber}
                        </Link>
                      </Td>
                      <Td>
                        <span className="block text-[11px] font-semibold text-ink-800">{order.customer?.name}</span>
                        <span className="text-[10px] text-ink-400">{order.customer?.phone}</span>
                      </Td>
                      <Td className="font-bold text-ink-900">{formatPKR(order.total)}</Td>
                      <Td>
                        <StatusBadge status={order.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-[10px] text-ink-400">{formatDate(order.createdAt)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableShell>
          )}
        </Panel>
      </div>
    </div>
  );
}
