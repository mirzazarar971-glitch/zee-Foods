import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bike, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import usePageTitle from '../hooks/usePageTitle';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import QtyStepper from '../components/ui/QtyStepper';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatPKR } from '../lib/format';
import { placeholderImage } from '../lib/orders';

export default function Cart() {
  usePageTitle('Your cart');
  const { items, subtotal, discount, coupon, updateQuantity, removeItem, clearCart, applyCouponCode, removeCoupon } =
    useCart();
  const { settings } = useSettings();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const threshold = Number(settings.freeDeliveryThreshold) || 0;
  const deliveryFee = Number(settings.deliveryFee) || 0;
  const qualifiesFree = subtotal >= threshold;
  const estimatedDelivery = qualifiesFree ? 0 : deliveryFee;
  const total = Math.max(0, subtotal - discount) + estimatedDelivery;
  const minOrder = Number(settings.minOrder) || 0;
  const belowMin = subtotal > 0 && subtotal < minOrder;
  const hasUnavailable = items.some((item) => item.isAvailable === false);
  const remainingForFree = Math.max(0, threshold - subtotal);
  const progress = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  const applyCoupon = async (event) => {
    event.preventDefault();
    setApplying(true);
    try {
      const result = await applyCouponCode(code);
      if (result.valid) {
        toast.success(result.message || 'Coupon applied');
        setCode('');
      } else {
        toast.error(result.message || 'That coupon is not valid.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Your bag" title="Your cart is empty" crumbs={[{ label: 'Cart' }]} />
        <div className="container-x py-12">
          <EmptyState
            icon={ShoppingBag}
            title="Nothing in the bag… yet"
            description="Your cravings are one tap away. Browse the menu and add something delicious."
            action={<Button to="/menu">Explore the menu</Button>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Your bag"
        title={`${items.reduce((sum, item) => sum + item.quantity, 0)} item${items.length === 1 ? '' : 's'} in your cart`}
        description="Review your order, apply a coupon and head to checkout. You can still edit quantities here."
        crumbs={[{ label: 'Cart' }]}
      >
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="inline-flex items-center gap-2 text-xs font-bold text-ink-500 transition hover:text-brand-600"
        >
          <Trash2 size={14} /> Clear cart
        </button>
      </PageHeader>

      <section className="container-x grid gap-8 py-8 lg:grid-cols-[1.35fr_0.65fr] lg:py-10">
        <div className="space-y-3">
          {hasUnavailable && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
              One or more items are no longer available. Remove them to continue to checkout.
            </div>
          )}

          {items.map((item) => {
            const addonTotal = item.addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
            const lineTotal = (item.unitPrice + addonTotal) * item.quantity;
            return (
              <article
                key={item.key}
                className="flex gap-4 rounded-3xl border border-ink-900/[0.06] bg-white p-4 shadow-soft sm:p-5"
              >
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <img
                    src={item.image || placeholderImage}
                    alt={item.name}
                    className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                    loading="lazy"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/product/${item.slug}`}
                        className="block truncate font-display text-[15px] font-bold text-ink-900 transition hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs font-medium text-ink-400">
                        {formatPKR(item.unitPrice)}
                        {item.variantName ? ` · ${item.variantName}` : ''}
                      </p>
                      {item.addons.length > 0 && (
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
                          Extras: {item.addons.map((addon) => addon.name).join(', ')}
                        </p>
                      )}
                      {item.instructions && (
                        <p className="mt-1 line-clamp-2 text-[11px] italic leading-relaxed text-ink-400">
                          “{item.instructions}”
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-rose-50 hover:text-brand-600"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <QtyStepper
                      value={item.quantity}
                      onChange={(value) => updateQuantity(item.key, value)}
                      min={1}
                      size="sm"
                    />
                    <p className="font-display text-base font-extrabold text-ink-900">{formatPKR(lineTotal)}</p>
                  </div>
                </div>
              </article>
            );
          })}

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            <ArrowRight size={15} className="rotate-180" /> Continue shopping
          </Link>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink-900">Order summary</h2>

            <div className="mt-4 rounded-2xl bg-cream-50 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
                <span className="flex items-center gap-1.5">
                  <Bike size={13} className="text-brand-600" /> Free delivery progress
                </span>
                <span>{qualifiesFree ? 'Unlocked' : formatPKR(remainingForFree)} away</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-ink-400">
                {qualifiesFree
                  ? 'Your order qualifies for free delivery.'
                  : `Add ${formatPKR(remainingForFree)} more to get free delivery.`}
              </p>
            </div>

            <div className="mt-5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-ink-500">
                <span>Subtotal</span>
                <span className="font-semibold text-ink-800">{formatPKR(subtotal)}</span>
              </div>
              {coupon && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} /> Coupon {coupon.code}
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        toast.success('Coupon removed');
                      }}
                      className="ml-1 text-[10px] font-bold text-ink-400 underline hover:text-brand-600"
                    >
                      remove
                    </button>
                  </span>
                  <span className="font-semibold">−{formatPKR(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-ink-500">
                <span>Delivery (estimate)</span>
                <span className="font-semibold text-ink-800">
                  {qualifiesFree ? <span className="text-emerald-600">Free</span> : formatPKR(estimatedDelivery)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-ink-900/10 pt-3">
                <span className="text-sm font-bold text-ink-900">Estimated total</span>
                <span className="font-display text-xl font-extrabold text-ink-900">{formatPKR(total)}</span>
              </div>
              <p className="text-[10px] font-medium leading-relaxed text-ink-400">
                Pickup orders have no delivery fee. Final amounts are confirmed at checkout.
              </p>
            </div>

            {!coupon && (
              <form onSubmit={applyCoupon} className="mt-5">
                <label htmlFor="coupon" className="label">
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="ZEE10"
                    className="input flex-1 font-mono uppercase tracking-wider"
                  />
                  <Button type="submit" variant="dark" size="sm" loading={applying} disabled={!code.trim()}>
                    Apply
                  </Button>
                </div>
              </form>
            )}

            {belowMin && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-800">
                Minimum order is {formatPKR(minOrder)}. Add {formatPKR(minOrder - subtotal)} more to checkout.
              </p>
            )}

            <Button
              to={belowMin || hasUnavailable ? undefined : '/checkout'}
              disabled={belowMin || hasUnavailable}
              size="lg"
              className="mt-5 w-full"
            >
              Proceed to checkout <ArrowRight size={16} />
            </Button>

            <p className="mt-3 text-center text-[10px] font-medium text-ink-400">
              Secure checkout · Cash on delivery available
            </p>
          </div>
        </aside>
      </section>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
          toast.success('Cart cleared');
        }}
        title="Clear your cart?"
        description="This removes every item and any applied coupon from your cart."
        confirmLabel="Clear cart"
      />
    </>
  );
}
