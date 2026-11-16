import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Flame,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import usePageTitle from '../hooks/usePageTitle';
import useFetch from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import Stars from '../components/ui/Stars';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Field';
import { cn, discountPercent, formatDate, formatPKR } from '../lib/format';
import { placeholderImage } from '../lib/orders';

function ReviewForm({ productId, onCreated }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-900/15 bg-cream-50 p-5 text-sm text-ink-500">
        <p className="font-semibold text-ink-800">Ordered this before?</p>
        <p className="mt-1">
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>{' '}
          to leave a review for this item.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
        <Check size={18} /> Thanks for your review — it means a lot to our kitchen.
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return toast.error('Choose a star rating first.');
    setSaving(true);
    try {
      await api.post('/reviews', { productId, rating, comment });
      toast.success('Review posted');
      setDone(true);
      onCreated?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink-900/[0.08] bg-cream-50/70 p-5">
      <p className="text-sm font-bold text-ink-900">Share your experience</p>
      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            className="rounded-md p-0.5 transition hover:scale-110"
          >
            <Star
              size={24}
              className={star <= rating ? 'fill-accent-400 text-accent-400' : 'fill-ink-200 text-ink-200'}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-1 text-xs font-semibold text-ink-500">{rating}/5</span>}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        minLength={4}
        maxLength={600}
        required
        rows={3}
        placeholder="How was the food, the portion size and the delivery?"
        className="input mt-3 resize-none"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-ink-400">{comment.length}/600</span>
        <Button type="submit" size="sm" loading={saving}>
          Post review
        </Button>
      </div>
    </form>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data, loading, error } = useFetch(`/products/${slug}`);
  const product = data?.product;
  const related = data?.related || [];

  usePageTitle(product?.name || 'Product');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [variantName, setVariantName] = useState('');
  const [addonNames, setAddonNames] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!product) return;
    setVariantName(product.variants?.[0]?.name || '');
    setAddonNames([]);
  }, [product]);

  useEffect(() => {
    if (!product?._id) return;
    let active = true;
    setReviewsLoading(true);
    api
      .get(`/reviews/product/${product._id}`)
      .then(({ data: res }) => {
        if (active) setReviews(res.reviews || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product?._id]);

  const variant = useMemo(
    () => product?.variants?.find((entry) => entry.name === variantName) || null,
    [product, variantName]
  );
  const selectedAddons = useMemo(
    () => (product?.addons || []).filter((entry) => addonNames.includes(entry.name)),
    [product, addonNames]
  );
  const addonTotal = selectedAddons.reduce((sum, entry) => sum + entry.price, 0);
  const unitPrice = (product?.price || 0) + (variant?.priceDelta || 0);
  const lineTotal = (unitPrice + addonTotal) * quantity;
  const discount = product ? discountPercent(product.price, product.compareAtPrice) : 0;

  const toggleAddon = (name) => {
    setAddonNames((prev) => (prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name]));
  };

  const addToCart = (redirect) => {
    if (!product?.isAvailable) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice,
      compareAtPrice: product.compareAtPrice,
      variantName,
      addons: selectedAddons.map((entry) => ({ name: entry.name, price: entry.price })),
      instructions,
      quantity,
      isAvailable: product.isAvailable,
    });
    toast.success(`${product.name} added to cart`);
    if (redirect) navigate('/checkout');
  };

  if (loading) return <PageSpinner label="Plating your dish…" />;

  if (error || !product) {
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={ShoppingBag}
          title="We couldn’t find that dish"
          description={error || 'It may have been removed from the menu. Browse the full menu for something else.'}
          action={<Button to="/menu">Back to menu</Button>}
        />
      </div>
    );
  }

  return (
    <div className="bg-cream-50">
      <div className="container-x pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-ink-500 transition hover:text-brand-600"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <section className="container-x grid gap-8 py-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:py-10">
        <div>
          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-card">
            <img
              src={product.image || placeholderImage}
              alt={product.name}
              className="aspect-[4/3.2] w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.isFeatured && (
                <span className="chip bg-brand-600 text-white shadow-soft">
                  <Flame size={12} /> Featured
                </span>
              )}
              {product.isPopular && <span className="chip bg-accent-500 text-ink-950 shadow-soft">Popular</span>}
              {discount > 0 && <span className="chip bg-white/95 text-brand-700 shadow-soft">Save {discount}%</span>}
            </div>
            {!product.isAvailable && (
              <div className="absolute inset-0 grid place-items-center bg-ink-950/55 backdrop-blur-[2px]">
                <span className="rounded-full bg-white px-5 py-2 text-sm font-bold uppercase tracking-wider text-ink-800">
                  Sold out for now
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: ChefHat, label: 'Prep time', value: `${product.prepTime} min` },
              { icon: Users, label: 'Serves', value: product.serves || '1 person' },
              { icon: ShieldCheck, label: 'Quality', value: '100% halal' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink-900/[0.06] bg-white p-3.5 text-center shadow-soft">
                <item.icon size={17} className="mx-auto text-brand-600" />
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">{item.label}</p>
                <p className="mt-0.5 text-xs font-bold text-ink-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category?.name && (
              <Link
                to={`/menu?category=${product.category.slug}`}
                className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100"
              >
                {product.category.name}
              </Link>
            )}
            <Badge tone={product.isAvailable ? 'success' : 'danger'} dot>
              {product.isAvailable ? 'Available now' : 'Unavailable'}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars value={product.rating} showValue count={product.numReviews} size={15} />
            <span className="text-xs text-ink-300">|</span>
            <a href="#reviews" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-600">
              <MessageSquare size={13} /> {product.numReviews} review{product.numReviews === 1 ? '' : 's'}
            </a>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-500">{product.description}</p>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="font-display text-3xl font-extrabold text-ink-900">{formatPKR(unitPrice + addonTotal)}</span>
            {product.compareAtPrice > product.price && (
              <span className="pb-1 text-sm font-medium text-ink-400 line-through">{formatPKR(product.compareAtPrice)}</span>
            )}
            <span className="pb-1 text-xs font-medium text-ink-400">incl. selected options</span>
          </div>

          <div className="mt-7 space-y-6">
            {product.variants?.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink-900">Choose a size</p>
                  <span className="text-[11px] font-medium text-ink-400">Required</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {product.variants.map((entry) => (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={() => setVariantName(entry.name)}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                        variantName === entry.name
                          ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-500/15'
                          : 'border-ink-900/10 bg-white text-ink-700 hover:border-ink-900/25'
                      )}
                    >
                      <span>{entry.name}</span>
                      <span className="text-xs font-bold text-ink-500">
                        {entry.priceDelta > 0 ? `+${formatPKR(entry.priceDelta)}` : 'Base'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.addons?.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink-900">Add extras</p>
                  <span className="text-[11px] font-medium text-ink-400">Optional</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {product.addons.map((addon) => {
                    const active = addonNames.includes(addon.name);
                    return (
                      <button
                        key={addon.name}
                        type="button"
                        onClick={() => toggleAddon(addon.name)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition',
                          active ? 'border-brand-500 bg-brand-50/60' : 'border-ink-900/10 bg-white hover:border-ink-900/25'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'grid h-5 w-5 place-items-center rounded-md border transition',
                              active ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white text-transparent'
                            )}
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span className="text-sm font-semibold text-ink-800">{addon.name}</span>
                        </span>
                        <span className="text-xs font-bold text-ink-500">+{formatPKR(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-ink-900">Special instructions</p>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value.slice(0, 300))}
                rows={2}
                placeholder="No onions, extra sauce, cut in half…"
                className="input mt-2 resize-none text-[13px]"
              />
              <p className="mt-1 text-right text-[10px] font-medium text-ink-400">{instructions.length}/300</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-ink-900/10 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-600 transition hover:bg-cream-100 disabled:opacity-35"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="min-w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                  disabled={quantity >= 20}
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-600 transition hover:bg-cream-100 disabled:opacity-35"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="flex-1">
                <Button onClick={() => addToCart(false)} disabled={!product.isAvailable} size="lg" className="w-full">
                  <ShoppingBag size={17} /> Add to cart · {formatPKR(lineTotal)}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => addToCart(true)}
              variant="outline"
              size="lg"
              disabled={!product.isAvailable}
              className="w-full"
            >
              Order now <ArrowRight size={16} />
            </Button>
          </div>

          {product.ingredients?.length > 0 && (
            <div className="mt-7 rounded-2xl border border-ink-900/[0.06] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">What&apos;s inside</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {product.ingredients.map((ingredient) => (
                  <span key={ingredient} className="chip bg-cream-100 text-[11px] text-ink-600">
                    {ingredient}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
                Allergies? Add a note above or message us on WhatsApp before ordering — our team will confirm the exact
                ingredients.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="reviews" className="container-x border-t border-ink-900/[0.06] py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Customer reviews</p>
            <h2 className="mt-2 text-2xl font-bold text-ink-900">
              {product.numReviews > 0 ? `${Number(product.rating).toFixed(1)} out of 5` : 'Be the first to review'}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <Stars value={product.rating} size={16} />
              <span className="text-xs font-medium text-ink-400">{product.numReviews} verified review{product.numReviews === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-6">
              <ReviewForm
                productId={product._id}
                onCreated={() => {
                  api
                    .get(`/reviews/product/${product._id}`)
                    .then(({ data: res }) => setReviews(res.reviews || []))
                    .catch(() => {});
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-24 w-full" />)
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-900/15 p-8 text-center text-sm text-ink-400">
                No reviews yet for this item.
              </div>
            ) : (
              reviews.map((review) => (
                <article key={review._id} className="rounded-2xl border border-ink-900/[0.06] bg-white p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-cream-50">
                        {review.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink-900">{review.name}</p>
                        <p className="text-[10px] font-medium text-ink-400">{formatDate(review.createdAt, { time: false })}</p>
                      </div>
                    </div>
                    <Stars value={review.rating} size={12} />
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x pb-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Goes well with</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-900">You might also like</h2>
            </div>
            <Link to="/menu" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Full menu
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item._id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
