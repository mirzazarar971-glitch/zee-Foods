import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Store,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import usePageTitle from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { PageSpinner } from '../../components/ui/Field';
import OrderTimeline from '../../components/order/OrderTimeline';
import { PaymentStatusBadge, StatusBadge } from '../../components/order/StatusBadge';
import { AdminHeader, Panel } from '../../components/admin/ui';
import { cn, formatDate, formatPKR } from '../../lib/format';
import { ORDER_STEPS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META, placeholderImage, STATUS_OPTIONS } from '../../lib/orders';

const QUICK_ACTIONS = [
  { status: 'confirmed', label: 'Confirm', icon: CheckCircle2 },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Clock3 },
  { status: 'out_for_delivery', label: 'Dispatch', icon: Bike },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export default function AdminOrderDetail() {
  usePageTitle('Admin order details');
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(`/admin/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.order);
        setStatus(data.order.status);
        setPaymentStatus(data.order.paymentStatus);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (nextStatus, extraNote = '', nextPaymentStatus) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/orders/${id}/status`, {
        status: nextStatus,
        note: extraNote || undefined,
        paymentStatus: nextPaymentStatus || undefined,
      });
      setOrder(data.order);
      setStatus(data.order.status);
      setPaymentStatus(data.order.paymentStatus);
      setNote('');
      toast.success(`Order marked ${nextStatus.replaceAll('_', ' ')}`);
      setCancelOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <PageSpinner label="Loading order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="font-display text-base font-bold text-rose-800">Order could not be loaded</p>
        <p className="mt-1 text-xs text-rose-600">{error || 'Order not found.'}</p>
        <Button to="/admin/orders" size="sm" variant="outline" className="mt-4">
          Back to orders
        </Button>
      </div>
    );
  }

  const canCancel = !['delivered', 'cancelled'].includes(order.status);
  const stepMeta = ORDER_STEPS.find((step) => step.key === order.status);

  return (
    <div className="space-y-5">
      <AdminHeader
        eyebrow="Order management"
        title={order.orderNumber}
        description={`Placed ${formatDate(order.createdAt)} · ${order.items.length} line items · ${order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}`}
      >
        <Button to="/admin/orders" size="sm" variant="outline">
          <ArrowLeft size={14} /> All orders
        </Button>
        <Button onClick={load} size="sm" variant="ghost">
          <RefreshCw size={14} />
        </Button>
        <Button onClick={() => window.print()} size="sm" variant="dark">
          <Printer size={14} /> Print receipt
        </Button>
      </AdminHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} className="px-3 py-1.5" />
        <PaymentStatusBadge status={order.paymentStatus} className="px-3 py-1.5" />
        <span className="chip bg-white text-[10px] text-ink-500 shadow-sm">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
        {order.couponCode && <span className="chip bg-emerald-50 text-[10px] text-emerald-700">Coupon {order.couponCode}</span>}
        {order.fulfillmentType === 'takeaway' && <span className="chip bg-violet-50 text-[10px] text-violet-700">Pickup order</span>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <Panel
            title="Update order status"
            description="The customer’s tracking page updates the moment you save."
            className="no-print"
          >
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => updateStatus(action.status)}
                  disabled={saving || order.status === action.status}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold transition',
                    order.status === action.status
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-900/10 bg-white text-ink-600 hover:border-ink-900/25 hover:text-ink-900',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  <action.icon size={13} /> {action.label}
                </button>
              ))}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Cancel order
                </button>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                updateStatus(status, note, paymentStatus);
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <label className="block">
                <span className="label">Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="input py-2.5 text-xs">
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Payment status</span>
                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  className="input py-2.5 text-xs"
                >
                  {Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Internal note (optional)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={300}
                  placeholder="e.g. Rider delayed due to rain"
                  className="input py-2.5 text-xs"
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" loading={saving}>
                  Save status update
                </Button>
              </div>
            </form>
          </Panel>

          <div className="print-receipt overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-ink-900/15 px-6 py-5">
              <div>
                <p className="font-display text-xl font-extrabold text-ink-900">
                  Zee <span className="text-brand-600">Foods</span>
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-ink-400">Plot 12, Main Boulevard, Gulberg III, Lahore</p>
                <p className="text-[10px] font-medium text-ink-400">+92 300 1234567 · hello@zeefoods.pk</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-400">Order receipt</p>
                <p className="mt-1 font-mono text-base font-extrabold tracking-wider text-ink-900">{order.orderNumber}</p>
                <p className="text-[10px] font-medium text-ink-400">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-dashed border-ink-900/15 px-6 py-4 text-[11px] sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Customer</p>
                <p className="mt-1 font-bold text-ink-800">{order.customer?.name}</p>
                <p className="text-ink-500">{order.customer?.phone}</p>
                {order.customer?.email && <p className="text-ink-500">{order.customer.email}</p>}
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">
                  {order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery address'}
                </p>
                <p className="mt-1 text-ink-600">
                  {order.fulfillmentType === 'takeaway'
                    ? 'Counter pickup · Gulberg III, Lahore'
                    : `${order.address?.line1}${order.address?.area ? `, ${order.address.area}` : ''}, ${order.address?.city}`}
                </p>
                {order.address?.notes && <p className="mt-1 italic text-ink-400">“{order.address.notes}”</p>}
              </div>
            </div>

            <div className="px-6 py-4">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-ink-900/10">
                    <th className="pb-2 text-[9px] font-bold uppercase tracking-wider text-ink-400">Item</th>
                    <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-wider text-ink-400">Qty</th>
                    <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-ink-400">Price</th>
                    <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-wider text-ink-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-b border-ink-900/[0.05] last:border-0">
                      <td className="py-2.5 pr-2">
                        <p className="font-bold text-ink-800">{item.name}</p>
                        <p className="text-[9px] text-ink-400">
                          {[item.variant?.name, ...(item.addons || []).map((addon) => addon.name)].filter(Boolean).join(' · ') || 'Standard'}
                        </p>
                        {item.instructions && <p className="text-[9px] italic text-ink-400">“{item.instructions}”</p>}
                      </td>
                      <td className="py-2.5 text-center text-ink-600">{item.quantity}</td>
                      <td className="py-2.5 text-right text-ink-600">{formatPKR(item.unitPrice)}</td>
                      <td className="py-2.5 text-right font-bold text-ink-900">{formatPKR(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 border-t border-dashed border-ink-900/15 px-6 py-4 text-[11px]">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal</span>
                <span className="font-semibold text-ink-800">{formatPKR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span className="font-semibold">−{formatPKR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-500">
                <span>{order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery fee'}</span>
                <span className="font-semibold text-ink-800">
                  {order.deliveryFee === 0 ? 'Free' : formatPKR(order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-ink-900/10 pt-2">
                <span className="text-xs font-bold text-ink-900">Total paid</span>
                <span className="font-display text-lg font-extrabold text-ink-900">{formatPKR(order.total)}</span>
              </div>
              <p className="pt-1 text-right text-[9px] font-medium uppercase tracking-wider text-ink-400">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.paymentStatus}
              </p>
            </div>

            <div className="border-t border-dashed border-ink-900/15 px-6 py-3 text-center">
              <p className="text-[10px] font-medium text-ink-400">Shukriya for ordering from Zee Foods — see you soon!</p>
              <p className="text-[9px] text-ink-300">zeefoods.pk</p>
            </div>
          </div>

          <Panel title="Status history" description="Every update logged for this order" className="no-print">
            <ol className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                  <div>
                    <p className="text-[11px] font-bold capitalize text-ink-800">{entry.status.replaceAll('_', ' ')}</p>
                    {entry.note && <p className="text-[11px] text-ink-500">{entry.note}</p>}
                    <p className="text-[10px] font-medium text-ink-400">{formatDate(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4 no-print">
          <Panel title="Customer">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-900 font-display text-sm font-bold text-cream-50">
                {order.customer?.name
                  ?.split(' ')
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink-900">{order.customer?.name}</p>
                <p className="truncate text-[10px] text-ink-400">{order.user?.email || order.customer?.email || 'Guest checkout'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-[11px]">
              <a href={`tel:${order.customer?.phone}`} className="flex items-center gap-2 text-ink-600 hover:text-brand-600">
                <Phone size={13} className="text-ink-400" /> {order.customer?.phone}
              </a>
              {order.customer?.email && (
                <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 break-all text-ink-600 hover:text-brand-600">
                  <Mail size={13} className="text-ink-400" /> {order.customer.email}
                </a>
              )}
              <p className="flex items-start gap-2 text-ink-600">
                {order.fulfillmentType === 'takeaway' ? (
                  <Store size={13} className="mt-0.5 shrink-0 text-ink-400" />
                ) : (
                  <MapPin size={13} className="mt-0.5 shrink-0 text-ink-400" />
                )}
                {order.fulfillmentType === 'takeaway'
                  ? 'Pickup from Gulberg III branch'
                  : `${order.address?.line1}${order.address?.area ? `, ${order.address.area}` : ''}, ${order.address?.city}`}
              </p>
            </div>
            {order.user?._id && (
              <Button to={`/admin/customers/${order.user._id}`} size="sm" variant="outline" className="mt-4 w-full">
                <UserRound size={13} /> View customer profile
              </Button>
            )}
          </Panel>

          <Panel title="Live progress">
            <p className="text-[11px] font-medium text-ink-500">{stepMeta?.description || 'Order closed.'}</p>
            <div className="mt-4">
              <OrderTimeline status={order.status} history={order.statusHistory} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-cream-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Placed</p>
                <p className="mt-0.5 text-[10px] font-semibold text-ink-700">{formatDate(order.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-cream-50 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">ETA</p>
                <p className="mt-0.5 text-[10px] font-semibold text-ink-700">{order.estimatedDeliveryMins} min</p>
              </div>
            </div>
          </Panel>

          <div className="rounded-2xl border border-ink-900/[0.06] bg-white p-5 text-[10px] leading-relaxed text-ink-400 shadow-soft">
            Internal order ID <span className="font-mono text-ink-600">{order._id}</span>. Changes are logged with a
            timestamp and visible to the customer.
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => updateStatus('cancelled', note || 'Cancelled by restaurant')}
        loading={saving}
        title="Cancel this order?"
        description="The customer will see the cancellation immediately. If they already paid online, the payment status is set to refunded."
        confirmLabel="Cancel order"
      />
    </div>
  );
}
