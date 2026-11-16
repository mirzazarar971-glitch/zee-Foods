import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, MessageCircle, PackageSearch, Search, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import usePageTitle from '../hooks/usePageTitle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import OrderTimeline from '../components/order/OrderTimeline';
import { StatusBadge } from '../components/order/StatusBadge';
import { formatDate, formatPKR, normalizePhone } from '../lib/format';
import { placeholderImage } from '../lib/orders';

export default function TrackOrder() {
  usePageTitle('Track your order');
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState((params.get('order') || '').toUpperCase());
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async (event) => {
    event?.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Enter both your order number and the phone number used to place it.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders/track', {
        params: { orderNumber: orderNumber.trim(), phone: normalizePhone(phone) },
      });
      setResult(data.order);
      toast.success('Order found');
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get('order')) {
      setOrderNumber(params.get('order').toUpperCase());
    }
  }, [params]);

  return (
    <>
      <PageHeader
        eyebrow="Order tracking"
        title={result ? `Order ${result.orderNumber}` : 'Where is my food?'}
        description={
          result
            ? `Placed ${formatDate(result.createdAt)} · ${result.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'} to ${result.city || 'your address'}`
            : 'Enter your order number and the mobile number used at checkout to follow every step from the kitchen to your door.'
        }
        crumbs={[{ label: 'Track order' }]}
      >
        {result && <StatusBadge status={result.status} className="px-3 py-1.5 text-xs" />}
      </PageHeader>

      <section className="container-x grid gap-6 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-10">
        <div className="space-y-5">
          <form onSubmit={track} className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <PackageSearch size={19} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-ink-900">Track your order</h2>
                <p className="text-[11px] text-ink-400">No account needed — just your details.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Order number" htmlFor="orderNumber" hint="Looks like ZF-1A2B3C — it’s on your confirmation.">
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(event) => {
                    setOrderNumber(event.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ZF-XXXXXX"
                  className="font-mono uppercase tracking-widest"
                  autoComplete="off"
                />
              </Field>
              <Field label="Mobile number" htmlFor="trackPhone" hint="The same number you used when ordering.">
                <Input
                  id="trackPhone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setError('');
                  }}
                  placeholder="0300 1234567"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-rose-700">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-5 w-full" loading={loading}>
              <Search size={15} /> Track order
            </Button>

            <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-ink-400">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" />
              For your privacy, we only show order details when the order number and phone number match.
            </p>
          </form>

          <div className="rounded-2xl border border-ink-900/[0.06] bg-white p-5">
            <p className="text-sm font-bold text-ink-900">Can&apos;t find your order?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Message us on WhatsApp with the name and phone number you ordered with — our team will find it for you.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" size="sm" variant="accent">
                <MessageCircle size={14} /> WhatsApp support
              </Button>
              <Button to="/account?tab=orders" size="sm" variant="outline">
                My orders
              </Button>
            </div>
          </div>
        </div>

        <div>
          {result ? (
            <div className="space-y-5">
              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Order number</p>
                    <p className="mt-1 font-mono text-xl font-extrabold tracking-wider text-ink-900">{result.orderNumber}</p>
                  </div>
                  <span className="chip bg-cream-100 text-ink-600">
                    <Clock3 size={13} className="text-brand-600" /> ~{result.estimatedDeliveryMins} min
                  </span>
                </div>

                <div className="mt-6">
                  <OrderTimeline status={result.status} history={result.statusHistory} />
                </div>

                <div className="mt-6 grid gap-3 border-t border-ink-900/[0.06] pt-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5 text-xs text-ink-500">
                    <Smartphone size={15} className="mt-0.5 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-semibold text-ink-800">Contact</p>
                      <p className="mt-0.5">
                        {result.customerName} · {result.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-ink-500">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-semibold text-ink-800">{result.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivering to'}</p>
                      <p className="mt-0.5">{result.fulfillmentType === 'takeaway' ? settings.address : result.city || 'Your address'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="border-b border-ink-900/[0.06] px-5 py-4">
                  <h2 className="font-display text-base font-bold text-ink-900">Items in this order</h2>
                </div>
                <div className="divide-y divide-ink-900/[0.05] px-5">
                  {result.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center gap-3 py-3.5">
                      <img src={item.image || placeholderImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink-800">
                          {item.quantity}× {item.name}
                        </p>
                        {item.variant && <p className="text-[10px] font-medium text-ink-400">{item.variant}</p>}
                      </div>
                      <p className="text-xs font-bold text-ink-800">{formatPKR(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-ink-900/[0.06] px-5 py-4 text-sm">
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink-800">{formatPKR(result.subtotal)}</span>
                  </div>
                  {result.discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>Discount</span>
                      <span className="font-semibold">−{formatPKR(result.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>{result.fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}</span>
                    <span className="font-semibold text-ink-800">
                      {result.deliveryFee === 0 ? <span className="text-emerald-600">Free</span> : formatPKR(result.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-ink-900/10 pt-2.5">
                    <span className="font-bold text-ink-900">Total</span>
                    <span className="font-display text-lg font-extrabold text-ink-900">{formatPKR(result.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/[0.06] bg-white px-5 py-4">
                <p className="text-xs text-ink-500">
                  Want the full order history?{' '}
                  <Link to="/account?tab=orders" className="font-bold text-brand-600 hover:text-brand-700">
                    Sign in to your account
                  </Link>
                </p>
                <Button to="/menu" size="sm" variant="outline">
                  Order again <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink-900/15 bg-white/50 px-8 py-14 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-cream-100 text-ink-400">
                <PackageSearch size={28} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">Your tracking timeline will appear here</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
                Enter your details on the left. You&apos;ll see each kitchen milestone, the rider status and your order
                summary.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
