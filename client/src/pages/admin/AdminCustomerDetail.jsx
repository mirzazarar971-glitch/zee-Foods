import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, ShoppingBag, Wallet } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { AdminHeader, StatCard, TableEmpty, TableShell, Td, Th } from '../../components/admin/ui';
import { StatusBadge } from '../../components/order/StatusBadge';
import { PageSpinner } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { formatDate, formatPKR, initials } from '../../lib/format';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/admin/customers/${id}`);
  const customer = data?.customer;
  const orders = data?.orders || [];
  usePageTitle(customer?.name || 'Customer');

  if (loading) return <PageSpinner label="Loading customer…" />;

  if (error || !customer) {
    return (
      <div className="rounded-3xl border border-brand-200 bg-white px-6 py-16 text-center">
        <p className="font-display text-lg font-bold text-ink-900">Customer not found</p>
        <p className="mt-1 text-sm text-ink-500">{error?.message || 'This account may have been removed.'}</p>
        <Button to="/admin/customers" className="mt-5" size="sm">
          Back to customers
        </Button>
      </div>
    );
  }

  const delivered = orders.filter((order) => order.status === 'delivered');
  const cancelled = orders.filter((order) => order.status === 'cancelled');
  const spent = orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate('/admin/customers')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={14} /> All customers
      </button>

      <AdminHeader eyebrow="Customer profile" title={customer.name} description="Lifetime relationship, saved addresses and full order history.">
        <Button to={`/admin/orders?search=${encodeURIComponent(customer.phone || customer.email || '')}`} size="sm" variant="outline">
          <ShoppingBag size={14} /> Find orders
        </Button>
      </AdminHeader>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-950 font-display text-lg font-bold text-cream-50">
                {initials(customer.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-ink-900">{customer.name}</p>
                <p className="text-[11px] font-semibold text-ink-400">Joined {formatDate(customer.createdAt, { time: false })}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-[12px] text-ink-600">
              <p className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{customer.email}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-ink-400" /> {customer.phone || 'No phone on file'}
              </p>
              <p className="flex items-center gap-2.5">
                <CalendarDays size={14} className="shrink-0 text-ink-400" />
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-900">
              <MapPin size={15} className="text-brand-600" /> Saved addresses
            </h3>
            {customer.addresses?.length ? (
              <ul className="mt-3 space-y-3">
                {customer.addresses.map((address) => (
                  <li key={address._id || `${address.line1}-${address.city}`} className="rounded-xl bg-cream-50 p-3 text-[11px] leading-relaxed text-ink-600">
                    <p className="font-bold text-ink-800">
                      {address.label}
                      {address.isDefault && <span className="ml-2 chip bg-emerald-50 text-[9px] text-emerald-700">Default</span>}
                    </p>
                    <p className="mt-1">
                      {address.line1}, {address.area}, {address.city}
                    </p>
                    {address.phone && <p className="text-ink-400">{address.phone}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-cream-50 p-3 text-[11px] text-ink-400">No saved addresses. The customer checks out as a guest-style delivery each time.</p>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={ShoppingBag} label="Orders" value={orders.length} hint={`${delivered.length} delivered · ${cancelled.length} cancelled`} accent="brand" />
            <StatCard icon={Wallet} label="Net spend" value={formatPKR(spent)} hint="Cancelled orders excluded" accent="emerald" />
            <StatCard icon={CalendarDays} label="Last order" value={orders[0] ? formatDate(orders[0].createdAt, { time: false }) : '—'} hint={orders[0]?.orderNumber || 'No orders yet'} accent="accent" />
          </div>

          <TableShell>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Placed</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th className="text-right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <TableEmpty colSpan={6} title="No orders yet" description="This customer has not checked out so far." />
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="transition hover:bg-cream-50/60">
                    <Td>
                      <p className="font-mono text-[10px] font-bold text-ink-900">{order.orderNumber}</p>
                      <p className="text-[10px] capitalize text-ink-400">{order.fulfillmentType?.replace('_', ' ')}</p>
                    </Td>
                    <Td className="text-[10px] text-ink-500">{formatDate(order.createdAt)}</Td>
                    <Td className="text-[11px] text-ink-600">{order.items?.reduce((sum, item) => sum + item.quantity, 0)} items</Td>
                    <Td className="text-[11px] font-bold text-ink-900">{formatPKR(order.total)}</Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <Link to={`/admin/orders/${order._id}`} className="text-[10px] font-bold text-brand-600 hover:underline">
                          View
                        </Link>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableShell>
        </div>
      </div>
    </div>
  );
}
