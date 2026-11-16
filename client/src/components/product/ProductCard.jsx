import { motion } from 'framer-motion';
import { Flame, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { cn, discountPercent, formatPKR } from '../../lib/format';
import { placeholderImage } from '../../lib/orders';

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const discount = discountPercent(product.price, product.compareAtPrice);

  const quickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!product.isAvailable) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      variantName: '',
      addons: [],
      instructions: '',
      isAvailable: product.isAvailable,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-white shadow-soft transition-shadow duration-300 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 block" aria-label={product.name}>
          <img
            src={product.image || placeholderImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/30 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {product.isFeatured && (
            <span className="chip bg-brand-600 text-white shadow-sm">
              <Flame size={11} /> Featured
            </span>
          )}
          {product.isPopular && !product.isFeatured && (
            <span className="chip bg-accent-500 text-ink-950 shadow-sm">Popular</span>
          )}
          {discount > 0 && <span className="chip bg-white/95 text-brand-700 shadow-sm">-{discount}%</span>}
        </div>
        {!product.isAvailable && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-ink-950/55 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-700">
              Sold out
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={quickAdd}
          disabled={!product.isAvailable}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-ink-900 shadow-soft transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">
            {product.category?.name || 'Zee Foods'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-500">
            <Star size={12} className="fill-accent-400 text-accent-400" />
            {product.numReviews > 0 ? Number(product.rating).toFixed(1) : 'New'}
          </span>
        </div>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1.5 font-display text-[17px] font-bold leading-snug text-ink-900 transition hover:text-brand-600"
        >
          {product.name}
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{product.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-extrabold text-ink-900">{formatPKR(product.price)}</span>
              {product.compareAtPrice > product.price && (
                <span className="text-xs font-medium text-ink-400 line-through">{formatPKR(product.compareAtPrice)}</span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-ink-400">{product.prepTime} min prep</p>
          </div>
          <Link
            to={`/product/${product.slug}`}
            className={cn(
              'rounded-full bg-cream-100 px-3 py-1.5 text-[11px] font-bold text-ink-600 transition hover:bg-ink-900 hover:text-cream-50'
            )}
          >
            {product.variants?.length > 1 ? 'Customise' : 'View'}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
