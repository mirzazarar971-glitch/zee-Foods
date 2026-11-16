import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, Printer, ReceiptText, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PageSpinner } from '../components/ui/Field';
import OrderTimeline from '../components/order/OrderTimeline';
import { PaymentStatusBadge, StatusBadge } from '../components/order/StatusBadge';
import { formatDate, formatPKR } from '../lib/format';
import { ORDER_STEPS, PAYMENT_METHOD_LABELS, placeholderImage } from '../lib/orders';

export default function OrderDetails() {
  usePageTitle('Order details');
  const { id } = useParams();
  const { settings } = useSettings();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(`/orders/mine/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const { data } = await api.patch(`/orders/mine/${id}/cancel`, { reason: 'Cancelled by customer' });
      setOrder(data.order);
      setCancelOpen(false);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container-x py-16">
        <PageSpinner label="Loading your order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={ReceiptText}
          title="Order not found"
          description={error || 'This order does not exist or belongs to another account.'}
          action={<Button to="/account?tab=orders">Back to my orders</Button>}
        />
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const stepMeta = ORDER_STEPS.find((step) => step.key === order.status);

  return (
    <>
      <div className="border-b border-ink-900/[0.06] bg-cream-100">
        <div className="container-x py-8">
          <Link
            to="/account?tab=orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-ink-500 transition hover:text-brand-600"
          >
            <ArrowLeft size={14} /> All orders
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Order details</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-extrabold tracking-wide text-ink-900">{order.orderNumber}</h1>
                <StatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <p className="mt-2 text-xs font-medium text-ink-500">
                Placed {formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{' '}
                {order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button to={`/track?order=${order.orderNumber}`} size="sm" variant="outline">
                <Truck size={14} /> Track live
              </Button>
              <Button onClick={() => window.print()} size="sm" variant="ghost">
                <Printer size={14} /> Print
              </Button>
              {canCancel && (
                <Button onClick={() => setCancelOpen(true)} size="sm" variant="ghost" className="text-brand-600">
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-6 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:py-10">
        <div className="print-receipt space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {order.status === 'cancelled' ? 'Order cancelled' : stepMeta?.description || 'Order progress'}
                </h2>
                <p className="mt-1 text-xs text-ink-400">
                  {order.status === 'delivered'
                    ? 'This order has been delivered. We hope you enjoyed it!'
                    : `Estimated ${order.fulfillmentType === 'takeaway' ? 'pickup' : 'delivery'} in about ${order.estimatedDeliveryMins} minutes from confirmation.`}
                </p>
              </div>
              {order.fulfillmentType === 'delivery' && order.status !== 'cancelled' && (
                <span className="chip shrink-0 bg-brand-50 text-brand-700">
                  <Truck size={13} /> Rider assigned soon
                </span>
              )}
            </div>
            <div className="mt-6">
              <OrderTimeline status={order.status} history={order.statusHistory} />
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-5 py-4">
              <h2 className="font-display text-base font-bold text-ink-900">Items</h2>
              <span className="text-[11px] font-semibold text-ink-400">{order.items.length} lines</span>
            </div>
            <div className="divide-y divide-ink-900/[0.05] px-5">
              {order.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3 py-4">
                  <img src={item.image || placeholderImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">
                      {item.quantity}× {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-ink-400">
                      {[item.variant?.name, ...(item.addons || []).map((addon) => addon.name)].filter(Boolean).join(' · ') || 'Standard'}
                    </p>
                    {item.instructions && <p className="truncate text-[11px] italic text-ink-400">“{item.instructions}”</p>}
                    <p className="mt-0.5 text-[11px] text-ink-400">{formatPKR(item.unitPrice)} each</p>
                  </div>
                  <p className="text-sm font-bold text-ink-900">{formatPKR(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-ink-900/[0.06] px-5 py-4 text-sm">
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
                <span>{order.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}</span>
                <span className="font-semibold text-ink-800">
                  {order.deliveryFee === 0 ? <span className="text-emerald-600">Free</span> : formatPKR(order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-ink-900/10 pt-2.5">
                <span className="font-bold text-ink-900">Total</span>
                <span className="font-display text-xl font-extrabold text-ink-900">{formatPKR(order.total)}</span>
              </div>
              <p className="pt-1 text-right text-[10px] font-medium text-ink-400">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.paymentStatus}
              </p>
            </div>
          </section>

          <section className="card p-5 no-print">
            <h2 className="font-display text-base font-bold text-ink-900">Status history</h2>
            <ol className="mt-3 space-y-3">
              {[...order.statusHistory].reverse().map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                  <div>
                    <p className="text-xs font-bold capitalize text-ink-800">{entry.status.replaceAll('_', ' ')}</p>
                    {entry.note && <p className="text-[11px] text-ink-500">{entry.note}</p>}
                    <p className="text-[10px] font-medium text-ink-400">{formatDate(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="no-print space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-base font-bold text-ink-900">
              {order.fulfillmentType === 'takeaway' ? 'Pickup from' : 'Delivering to'}
            </h2>
            <div className="mt-3 flex gap-3 text-xs leading-relaxed text-ink-500">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-ink-800">{order.customer?.name}</p>
                <p>{order.customer?.phone}</p>
                {order.customer?.email && <p>{order.customer.email}</p>}
                <p className="mt-2">
                  {order.fulfillmentType === 'takeaway'
                    ? settings.address
                    : `${order.address?.line1}${order.address?.area ? `, ${order.address.area}` : ''}, ${order.address?.city}`}
                </p>
              </div>
            </div>
            {order.address?.notes && (
              <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-[11px] italic text-ink-500">“{order.address.notes}”</p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <MessageCircle size={14} /> Need help with this order?
            </p>
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hi Zee Foods, I need help with order ${order.orderNumber}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] font-bold text-emerald-800 underline hover:text-emerald-900"
            >
              Message us on WhatsApp
            </a>
            <p className="mt-1 text-[10px] text-emerald-700">{settings.phone}</p>
          </div>

          <Button to="/menu" className="w-full" variant="outline">
            Order something else
          </Button>
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        loading={cancelling}
        title="Cancel this order?"
        description="You can only cancel while the order is pending or confirmed. After that, please call the restaurant."
        confirmLabel="Cancel order"
      />
    </>
  );
}
