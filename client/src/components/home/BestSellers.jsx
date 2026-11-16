import { Link } from 'react-router-dom';
import { ArrowRight, Award, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { useCart } from '../../context/CartContext';
import { formatPKR } from '../../lib/format';
import { placeholderImage } from '../../lib/orders';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="h-14 w-14 shrink-0 skeleton rounded-xl opacity-20" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-2/3 opacity-20" />
        <div className="skeleton h-2.5 w-1/3 opacity-20" />
      </div>
    </div>
  );
}

export default function BestSellers({ products = [], loading }) {
  const { addItem } = useCart();

  const quickAdd = (product) => {
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      isAvailable: product.isAvailable,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <section className="relative overflow-hidden bg-ink-950 py-16 text-cream-50 sm:py-24">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] dot-grid" />

      <div className="container-x relative grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-400">
            <Award size={14} /> Best sellers
          </p>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            The orders everyone keeps coming back for
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-100/55">
            Ranked by what Lahore actually orders. If you are new here, start with one of these — you genuinely cannot
            go wrong.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/menu?sort=rating" variant="accent">
              Browse top rated
            </Button>
            <Button to="/menu?category=deals" variant="outline" className="border-white/20 bg-transparent text-cream-50 hover:border-white/40 hover:bg-white/5">
              See combo deals
            </Button>
          </div>
          <div className="mt-10 grid max-w-sm grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {[
              ['42+', 'menu items'],
              ['35 min', 'avg. delivery'],
              ['4.9★', 'customer rating'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream-100/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <RowSkeleton key={index} />)
            : products.map((product, index) => (
                <div
                  key={product._id}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-accent-400/40 hover:bg-white/[0.07]"
                >
                  <span className="hidden w-8 shrink-0 text-center font-display text-lg font-extrabold text-white/25 sm:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Link to={`/product/${product.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-900">
                    <img
                      src={product.image || placeholderImage}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="block truncate text-sm font-bold text-white transition hover:text-accent-300"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] font-medium text-cream-100/40">
                      {product.category?.name || 'Zee Foods'} · {product.numReviews} reviews
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-accent-400">{formatPKR(product.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickAdd(product)}
                    disabled={!product.isAvailable}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-cream-100 transition hover:border-accent-400 hover:bg-accent-500 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Plus size={17} />
                  </button>
                </div>
              ))}
          <Link
            to="/menu?sort=rating"
            className="group mt-4 flex items-center justify-between rounded-2xl border border-dashed border-white/15 px-5 py-4 text-sm font-semibold text-cream-100/70 transition hover:border-accent-400/50 hover:text-white"
          >
            Explore the full menu
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
