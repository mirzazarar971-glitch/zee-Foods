import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Bike,
  Check,
  CreditCard,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Store,
  Tag,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import usePageTitle from '../hooks/usePageTitle';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { cn, formatPKR, normalizePhone } from '../lib/format';
import { placeholderImage } from '../lib/orders';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  city: 'Lahore',
  area: '',
  notes: '',
};

export default function Checkout() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, discount, coupon, clearCart } = useCart();
  const { settings } = useSettings();

  const [form, setForm] = useState(emptyForm);
  const [fulfillmentType, setFulfillmentType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const addresses = user?.addresses || [];
  const defaultAddress = useMemo(() => addresses.find((entry) => entry.isDefault) || addresses[0], [addresses]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      phone: prev.phone || user.phone || defaultAddress?.phone || '',
      email: prev.email || user.email || '',
      line1: prev.line1 || defaultAddress?.line1 || '',
      city: defaultAddress?.city || prev.city || 'Lahore',
      area: prev.area || defaultAddress?.area || '',
    }));
    if (defaultAddress?._id) setSelectedAddressId((prev) => prev || defaultAddress._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const applyAddress = (address) => {
    setSelectedAddressId(address._id);
    setForm((prev) => ({
      ...prev,
      line1: address.line1,
      city: address.city || prev.city,
      area: address.area || '',
      phone: prev.phone || address.phone || '',
    }));
  };

  const threshold = Number(settings.freeDeliveryThreshold) || 0;
  const baseDelivery = Number(settings.deliveryFee) || 0;
  const deliveryFee =
    fulfillmentType === 'takeaway' ? 0 : subtotal >= threshold ? 0 : baseDelivery;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const minOrder = Number(settings.minOrder) || 0;
  const belowMin = subtotal < minOrder;
  const hasUnavailable = items.some((item) => item.isAvailable === false);

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name.';
    if (!/^(\+?92|0)?3\d{9}$/.test(normalizePhone(form.phone))) {
      next.phone = 'Enter a valid mobile number, e.g. 03001234567.';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (fulfillmentType === 'delivery') {
      if (form.line1.trim().length < 5) next.line1 = 'Enter your complete delivery address.';
      if (form.city.trim().length < 2) next.city = 'Enter your city.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please check the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: normalizePhone(form.phone),
          email: form.email.trim(),
        },
        fulfillmentType,
        address: {
          line1: fulfillmentType === 'takeaway' ? '' : form.line1.trim(),
          city: fulfillmentType === 'takeaway' ? '' : form.city.trim(),
          area: fulfillmentType === 'takeaway' ? '' : form.area.trim(),
          notes: form.notes.trim(),
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName || '',
          addonNames: item.addons.map((addon) => addon.name),
          instructions: item.instructions || '',
        })),
        couponCode: coupon?.code || '',
        paymentMethod,
      };
      const { data } = await api.post('/orders', payload);
      sessionStorage.setItem('zf_last_order', JSON.stringify(data.order));
      clearCart();
      toast.success('Order placed — the kitchen is on it!');
      navigate(`/order/${data.order._id}/confirmation`, {
        replace: true,
        state: { order: data.order, paymentNote: data.paymentNote },
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Nothing to check out" crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
        <div className="container-x py-12">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add a few items from the menu, then come back to complete your order."
            action={<Button to="/menu">Browse the menu</Button>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Almost there"
        title="Checkout"
        description="Tell us where the food is going and how you'd like to pay. It takes less than a minute."
        crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}
      >
        {!user && (
          <p className="text-xs font-medium text-ink-500">
            Have an account?{' '}
            <Link to="/login?redirect=/checkout" className="font-bold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>{' '}
            to save this address and track orders.
          </p>
        )}
      </PageHeader>

      <form onSubmit={placeOrder} className="container-x grid gap-8 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:py-10">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <UserRound size={17} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">Your details</h2>
                <p className="text-xs text-ink-400">We&apos;ll only use these to confirm and deliver your order.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={errors.name}>
                <Input id="name" value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="Used for order updates and tracking.">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="0300 1234567"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Email (optional)" htmlFor="email" error={errors.email} className="sm:col-span-2">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Bike size={17} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">How would you like it?</h2>
                <p className="text-xs text-ink-400">Delivery to your door or pickup from the counter.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { value: 'delivery', icon: Bike, title: 'Delivery', description: `${settings.deliveryTimeMins} min average · ${formatPKR(baseDelivery)}` },
                { value: 'takeaway', icon: Store, title: 'Takeaway / pickup', description: 'Collect from Gulberg III · no fee' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFulfillmentType(option.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
                    fulfillmentType === option.value
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/10'
                      : 'border-ink-900/10 bg-white hover:border-ink-900/25'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                      fulfillmentType === option.value ? 'bg-brand-600 text-white' : 'bg-cream-100 text-ink-500'
                    )}
                  >
                    <option.icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink-900">{option.title}</span>
                    <span className="mt-0.5 block text-[11px] font-medium text-ink-400">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="mt-6 space-y-4">
                {addresses.length > 0 && (
                  <div>
                    <p className="label">Saved addresses</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {addresses.map((address) => (
                        <button
                          key={address._id}
                          type="button"
                          onClick={() => applyAddress(address)}
                          className={cn(
                            'rounded-2xl border p-3.5 text-left transition',
                            selectedAddressId === address._id
                              ? 'border-brand-500 bg-brand-50/50'
                              : 'border-ink-900/10 bg-white hover:border-ink-900/25'
                          )}
                        >
                          <span className="flex items-center gap-2 text-xs font-bold text-ink-800">
                            <MapPin size={13} className="text-brand-600" /> {address.label || 'Address'}
                            {address.isDefault && <span className="chip bg-ink-900 px-2 py-0.5 text-[9px] text-cream-50">Default</span>}
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-ink-500">
                            {address.line1}, {address.area ? `${address.area}, ` : ''}
                            {address.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Field label="Delivery address" htmlFor="line1" error={errors.line1}>
                  <Input
                    id="line1"
                    value={form.line1}
                    onChange={set('line1')}
                    placeholder="House / flat, street, block"
                    autoComplete="address-line1"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" htmlFor="city" error={errors.city}>
                    <Input id="city" value={form.city} onChange={set('city')} placeholder="Lahore" autoComplete="address-level2" />
                  </Field>
                  <Field label="Area / phase" htmlFor="area">
                    <Input id="area" value={form.area} onChange={set('area')} placeholder="e.g. Gulberg III" />
                  </Field>
                </div>
              </div>
            )}

            <Field
              label="Order notes (optional)"
              htmlFor="notes"
              hint="Delivery instructions, landmark, allergies or anything the kitchen should know."
              className="mt-4"
            >
              <textarea
                id="notes"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                maxLength={500}
                placeholder="Ring the bell twice, extra napkins, no onions…"
                className="input resize-none"
              />
            </Field>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <CreditCard size={17} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">Payment method</h2>
                <p className="text-xs text-ink-400">Choose how you want to pay.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition',
                  paymentMethod === 'cod' ? 'border-brand-600 bg-brand-50/60' : 'border-ink-900/10 hover:border-ink-900/25'
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl',
                    paymentMethod === 'cod' ? 'bg-brand-600 text-white' : 'bg-cream-100 text-ink-500'
                  )}
                >
                  <Banknote size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-ink-900">Cash on delivery</span>
                  <span className="text-[11px] font-medium text-ink-400">Pay the rider when your food arrives.</span>
                </span>
                {paymentMethod === 'cod' && <Check size={18} className="text-brand-600" />}
              </button>

              <button
                type="button"
                onClick={() => settings.onlinePaymentEnabled && setPaymentMethod('online')}
                disabled={!settings.onlinePaymentEnabled}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition',
                  paymentMethod === 'online' ? 'border-brand-600 bg-brand-50/60' : 'border-ink-900/10',
                  !settings.onlinePaymentEnabled && 'cursor-not-allowed opacity-55'
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl',
                    paymentMethod === 'online' ? 'bg-brand-600 text-white' : 'bg-cream-100 text-ink-500'
                  )}
                >
                  <CreditCard size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-ink-900">Online payment</span>
                  <span className="text-[11px] font-medium text-ink-400">
                    {settings.onlinePaymentEnabled
                      ? 'We’ll send a secure payment link on WhatsApp before dispatch.'
                      : 'Not available right now — please choose cash on delivery.'}
                  </span>
                </span>
                {paymentMethod === 'online' && <Check size={18} className="text-brand-600" />}
              </button>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-900/[0.06] px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">Your order</h2>
              <p className="text-[11px] font-medium text-ink-400">
                {items.reduce((sum, item) => sum + item.quantity, 0)} items · {fulfillmentType === 'delivery' ? 'delivery' : 'pickup'}
              </p>
            </div>

            <div className="scroll-thin max-h-72 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => {
                const addonTotal = item.addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={item.image || placeholderImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1 text-[9px] font-bold text-cream-50">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink-800">{item.name}</p>
                      <p className="truncate text-[10px] font-medium text-ink-400">
                        {[item.variantName, item.addons.map((addon) => addon.name).join(', ')].filter(Boolean).join(' · ') ||
                          'Standard'}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-bold text-ink-800">
                      {formatPKR((item.unitPrice + addonTotal) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-ink-900/[0.06] px-5 py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-800">{formatPKR(subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} /> {coupon.code}
                    </span>
                    <span className="font-semibold">−{formatPKR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-500">
                  <span>{fulfillmentType === 'takeaway' ? 'Pickup' : 'Delivery'}</span>
                  <span className="font-semibold text-ink-800">
                    {deliveryFee === 0 ? <span className="text-emerald-600">Free</span> : formatPKR(deliveryFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-ink-900/10 pt-3">
                  <span className="font-bold text-ink-900">Total payable</span>
                  <span className="font-display text-2xl font-extrabold text-ink-900">{formatPKR(total)}</span>
                </div>
              </div>

              {belowMin && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  Minimum order is {formatPKR(minOrder)}. Please add {formatPKR(minOrder - subtotal)} more.
                </p>
              )}
              {hasUnavailable && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                  Some items are unavailable. Update your cart to continue.
                </p>
              )}

              <Button type="submit" size="lg" className="mt-4 w-full" loading={submitting} disabled={belowMin || hasUnavailable}>
                Confirm order · {formatPKR(total)} <ArrowRight size={16} />
              </Button>
              <p className="mt-3 text-center text-[10px] font-medium leading-relaxed text-ink-400">
                By confirming you agree to our delivery terms. Need help?{' '}
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle size={10} /> WhatsApp us
                </a>
              </p>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
