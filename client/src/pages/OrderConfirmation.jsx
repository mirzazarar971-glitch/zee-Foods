import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, ChefHat, Clock3, MapPin, MessageCircle, PackageCheck, ShoppingBag, Truck } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { StatusBadge } from '../components/order/StatusBadge';
import { PageSpinner } from '../components/ui/Field';
import { formatDate, formatPKR } from '../lib/format';
import { PAYMENT_METHOD_LABELS, placeholderImage } from '../lib/orders';

export default function OrderConfirmation() {
  usePageTitle('Order confirmed');
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [order, setOrder] = useState(location.state?.order || null);
  const [paymentNote, setPaymentNote] = useState(location.state?.paymentNote || '');
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (order) return undefined;
    try {
      const stored = JSON.parse(sessionStorage.getItem('zf_last_order'));
      if (stored?._id === id) {
        setOrder(stored);
        setLoading(false);
        return undefined;
      }
    } catch {
      /* ignore corrupt cache */
    }

    let active = true;
    if (!user) {
      setLoading(false);
      return undefined;
    }
    api
      .get(`/orders/mine/${id}`)
      .then(({ data }) => {
        if (active) setOrder(data.order);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user, order]);

  if (loading) {
    return (
      <div className="container-x py-20">
        <PageSpinner label="Confirming your order…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={ShoppingBag}
          title="We couldn’t load this order"
          description="If you’ve just placed it, check your account for the order, or track it with your order number and phone."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button to="/account?tab=orders">My orders</Button>
              <Button to="/track" variant="outline">
                Track an order
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const active = !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="bg-cream-50">
      <div className="container-x max-w-4xl py-10 sm:py-14">
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <CheckCircle2 size={40} />
          </span>
          <p className="eyebrow mt-6 justify-center">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink-900 sm:text-4xl">The kitchen is on it!</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
            Thanks{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}. Your order{' '}
            <span className="font-mono font-bold text-ink-900">{order.orderNumber}</span> is confirmed and we&apos;ll send
            updates to {order.customer?.phone}.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="chip bg-white text-ink-700 shadow-sm">
              <Clock3 size={13} className="text-brand-600" /> Ready in about {order.estimatedDeliveryMins || settings.deliveryTimeMins} min
            </span>
            <StatusBadge status={order.status} />
            <span className="chip bg-white text-ink-700 shadow-sm">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-ink-900/[0.06] px-5 py-4">
              <h2 className="font-display text-base font-bold text-ink-900">Order summary</h2>
              <span className="text-[11px] font-semibold text-ink-400">
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="divide-y divide-ink-900/[0.05] px-5">
              {order.items.map((item) => (
                <div key={item._id || `${item.name}-${item.variant?.name}`} className="flex items-center gap-3 py-3.5">
                  <img src={item.image || placeholderImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink-800">
                      {item.quantity}× {item.name}
                    </p>
                    <p className="truncate text-[10px] font-medium text-ink-400">
                      {[item.variant?.name, ...(item.addons || []).map((addon) => addon.name)].filter(Boolean).join(' · ') || 'Standard'}
                    </p>
                    {item.instructions && <p className="truncate text-[10px] italic text-ink-400">“{item.instructions}”</p>}
                  </div>
                  <p className="shrink-0 text-xs font-bold text-ink-800">{formatPKR(item.lineTotal)}</p>
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
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-display text-sm font-bold text-ink-900">
                {order.fulfillmentType === 'takeaway' ? 'Pickup details' : 'Delivery details'}
              </h3>
              <div className="mt-3 flex gap-3 text-xs leading-relaxed text-ink-500">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <p className="font-semibold text-ink-800">{order.customer?.name}</p>
                  {order.fulfillmentType === 'takeaway' ? (
                    <p>{settings.address}</p>
                  ) : (
                    <p>
                      {order.address?.line1}
                      {order.address?.area ? `, ${order.address.area}` : ''}, {order.address?.city}
                    </p>
                  )}
                  <p className="mt-1">{order.customer?.phone}</p>
                </div>
              </div>
              {order.address?.notes && (
                <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-[11px] italic text-ink-500">“{order.address.notes}”</p>
              )}
              <p className="mt-4 text-[11px] font-medium text-ink-400">Placed {formatDate(order.createdAt)}</p>
            </div>

            {paymentNote && (
              <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4 text-xs leading-relaxed text-accent-800">
                <p className="font-bold">Payment</p>
                <p className="mt-1">{paymentNote}</p>
              </div>
            )}

            <div className="card p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  {active ? <ChefHat size={18} /> : <PackageCheck size={18} />}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{active ? 'What happens next?' : 'Order closed'}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    {active
                      ? 'We confirm, cook fresh, pack it hot and hand it to a rider. You can follow every step in real time.'
                      : 'This order is complete. We hope you loved it — reviews help our kitchen improve.'}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  to={`/track?order=${order.orderNumber}`}
                  size="sm"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Truck size={14} /> Track this order
                  </span>
                  <span className="font-mono text-[10px] font-bold text-ink-400">{order.orderNumber}</span>
                </Button>
                {user && (
                  <Button to={`/account/orders/${order._id}`} size="sm" variant="ghost" className="w-full">
                    View in my account
                  </Button>
                )}
                <Button to="/menu" size="sm" variant="ghost" className="w-full">
                  Order something else
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <MessageCircle size={14} /> Need to change something?
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
                Call or WhatsApp us right away and we&apos;ll update the kitchen before it&apos;s cooked.
              </p>
              <a
                href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hi Zee Foods, I need help with order ${order.orderNumber}`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[11px] font-bold text-emerald-800 underline hover:text-emerald-900"
              >
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-white/60 px-5 py-4 text-[11px] text-ink-400">
          <p>Keep your order number safe — you&apos;ll need it with your phone number to track the order.</p>
          <Link to={`/track?order=${order.orderNumber}`} className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-700">
            <Truck size={13} className="hidden sm:block" /> Track order
          </Link>
        </div>
      </div>
    </div>
  );
}
