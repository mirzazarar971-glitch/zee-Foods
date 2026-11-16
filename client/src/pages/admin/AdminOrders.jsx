import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Filter, RefreshCw, X } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { AdminHeader, Pagination, SearchBox, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import Button from '../../components/ui/Button';
import { PaymentStatusBadge, StatusBadge } from '../../components/order/StatusBadge';
import { cn, formatDate, formatPKR } from '../../lib/format';
import { PAYMENT_METHOD_LABELS, STATUS_OPTIONS } from '../../lib/orders';

const STATUS_TABS = [{ value: 'all', label: 'All orders' }, ...STATUS_OPTIONS];

export default function AdminOrders() {
  usePageTitle('Admin orders');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const search = params.get('search') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const [searchInput, setSearchInput] = useState(search);

  const setParam = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || (key === 'status' && value === 'all') || (key === 'page' && Number(value) <= 1)) next.delete(key);
      else next.set(key, value);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== search) setParam('search', searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const url = useMemo(() => {
    const next = new URLSearchParams({ page: String(page), status, limit: '15' });
    if (search) next.set('search', search);
    if (from) next.set('from', from);
    if (to) next.set('to', to);
    return `/admin/orders?${next.toString()}`;
  }, [page, status, search, from, to]);

  const { data, loading, error, reload } = useFetch(url, { deps: [url] });
  const orders = data?.orders || [];
  const counts = data?.statusCounts || {};
  const totalOrders = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const hasFilters = status !== 'all' || search || from || to;

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Kitchen queue"
        title="Orders"
        description="Search, filter and move orders through the kitchen. Status changes update customer tracking instantly."
      >
        <Button onClick={reload} size="sm" variant="outline">
          <RefreshCw size={14} /> Refresh
        </Button>
      </AdminHeader>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'all' ? totalOrders : counts[tab.value] || 0;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setParam('status', tab.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[11px] font-bold transition',
                status === tab.value
                  ? 'bg-ink-900 text-cream-50 shadow-soft'
                  : 'border border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/25'
              )}
            >
              {tab.label}
              <span className={cn('ml-1.5 text-[10px]', status === tab.value ? 'text-cream-200' : 'text-ink-400')}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <SearchBox
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search order number, name or phone…"
          className="flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <CalendarDays size={13} /> From
          </span>
          <input
            type="date"
            value={from}
            onChange={(event) => setParam('from', event.target.value)}
            className="rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-[11px] font-semibold text-ink-700 outline-none focus:border-brand-400"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setParam('to', event.target.value)}
            className="rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-[11px] font-semibold text-ink-700 outline-none focus:border-brand-400"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setParams({});
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold text-ink-500 transition hover:bg-cream-100 hover:text-brand-600"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700">
          {error}{' '}
          <button type="button" onClick={reload} className="font-bold underline">
            Retry
          </button>
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Type</Th>
              <Th>Payment</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Placed</Th>
              <Th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <Td colSpan={9}>
                    <div className="skeleton h-8 w-full" />
                  </Td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <TableEmpty
                colSpan={9}
                title="No orders match these filters"
                description="Try a different status or date range, or clear the filters to see everything."
              />
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="group transition hover:bg-cream-50/60">
                  <Td>
                    <Link to={`/admin/orders/${order._id}`} className="font-mono text-[11px] font-bold text-ink-900 hover:text-brand-600">
                      {order.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <p className="text-[11px] font-semibold text-ink-800">{order.customer?.name}</p>
                    <p className="text-[10px] text-ink-400">{order.customer?.phone}</p>
                  </Td>
                  <Td className="text-[11px]">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</Td>
                  <Td>
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', order.fulfillmentType === 'takeaway' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700')}>
                      {order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}
                    </span>
                  </Td>
                  <Td>
                    <p className="text-[10px] font-semibold text-ink-600">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                    <PaymentStatusBadge status={order.paymentStatus} className="mt-1" />
                  </Td>
                  <Td className="font-bold text-ink-900">{formatPKR(order.total)}</Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-[10px] text-ink-400">{formatDate(order.createdAt)}</Td>
                  <Td>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="grid h-7 w-7 place-items-center rounded-full bg-cream-100 text-ink-500 transition group-hover:bg-ink-900 group-hover:text-cream-50"
                      aria-label={`Open order ${order.orderNumber}`}
                    >
                      <ArrowUpRight size={13} />
                    </Link>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
          <Filter size={12} /> Filters apply instantly
        </p>
        <Pagination page={page} pages={data?.pages || 0} total={data?.total} onChange={(next) => setParam('page', next)} />
      </div>
    </div>
  );
}
