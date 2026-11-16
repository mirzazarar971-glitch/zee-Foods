import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Sparkles, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatPKR } from '../../lib/format';

export default function DealsBand({ coupons = [] }) {
  const [copied, setCopied] = useState('');

  if (!coupons.length) return null;

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`Coupon ${code} copied — apply it at checkout`);
      setTimeout(() => setCopied(''), 2200);
    } catch {
      toast.error('Could not copy the code. Please type it manually.');
    }
  };

  return (
    <section className="relative overflow-hidden bg-cream-200 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />
      <div className="container-x relative">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <Sparkles size={13} /> Deals & discounts
            </p>
            <h2 className="section-title mt-2">
              Stack the savings, <span className="text-brand-600">not just the patties</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Tap a coupon to copy it, then paste it in your cart. One coupon per order — the best one wins.
            </p>
          </div>
          <Link
            to="/menu?category=deals"
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-cream-50 transition hover:bg-ink-800"
          >
            <Ticket size={15} className="text-accent-400" /> Shop combo deals
          </Link>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon, index) => (
            <div
              key={coupon._id || coupon.code}
              className="group relative overflow-hidden rounded-3xl border border-ink-900/[0.07] bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className={`h-1.5 w-full ${index % 2 === 0 ? 'bg-brand-600' : 'bg-accent-500'}`} />
              <div className="flex items-start justify-between gap-3 p-5 pb-4">
                <div>
                  <p className="font-display text-2xl font-extrabold text-ink-900">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${formatPKR(coupon.value)} OFF`}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-ink-500">
                    {coupon.description || 'Valid on your next Zee Foods order.'}
                  </p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Ticket size={20} />
                </span>
              </div>

              <div className="mx-5 border-t border-dashed border-ink-900/15" />

              <div className="flex items-end justify-between gap-3 p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Min order {coupon.minOrder ? formatPKR(coupon.minOrder) : 'any amount'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-ink-400">
                    Expires {formatDate(coupon.expiresAt, { time: false })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(coupon.code)}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-brand-400 bg-brand-50/60 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brand-700 transition hover:bg-brand-100"
                  aria-label={`Copy coupon code ${coupon.code}`}
                >
                  {copied === coupon.code ? <Check size={13} /> : <Copy size={13} />}
                  {coupon.code}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
