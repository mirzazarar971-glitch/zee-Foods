import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react';
import api from '../lib/api';
import usePageTitle from '../hooks/usePageTitle';
import useFetch from '../hooks/useFetch';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/ui/PageHeader';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { cn, formatPKR } from '../lib/format';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest first' },
];

const LIMIT = 12;

export default function Menu() {
  usePageTitle('Menu');
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'recommended';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setParam = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 'recommended' || (key === 'page' && Number(value) <= 1)) next.delete(key);
      else next.set(key, value);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== search) setParam('search', searchInput.trim());
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useMemo(() => {
    const next = new URLSearchParams({ limit: String(LIMIT), page: String(page), sort });
    if (category !== 'all') next.set('category', category);
    if (search) next.set('search', search);
    return next.toString();
  }, [category, search, sort, page]);

  const { data, loading, error, reload } = useFetch(`/products?${query}`);
  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.pages || 0;

  const activeCategory = categories.find((entry) => entry.slug === category);
  const hasFilters = category !== 'all' || Boolean(search) || sort !== 'recommended';

  const clearFilters = () => {
    setSearchInput('');
    setParams({});
  };

  return (
    <>
      <PageHeader
        eyebrow="The full menu"
        title={activeCategory ? activeCategory.name : 'Every craving, one menu'}
        description={
          activeCategory?.description ||
          'Burgers, pizza, zingers, shawarma, loaded fries, drinks and combo deals — all cooked fresh to order and priced honestly.'
        }
        crumbs={activeCategory ? [{ label: 'Menu', to: '/menu' }, { label: activeCategory.name }] : [{ label: 'Menu' }]}
      >
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-ink-500">
          <span className="chip bg-white shadow-sm">Free delivery over {formatPKR(settings.freeDeliveryThreshold)}</span>
          <span className="chip bg-white shadow-sm">Delivery from {formatPKR(settings.deliveryFee)}</span>
          <span className="chip bg-white shadow-sm">{settings.deliveryTimeMins} min average</span>
        </div>
      </PageHeader>

      <div className="sticky top-[68px] z-30 border-b border-ink-900/[0.06] bg-cream-50/90 backdrop-blur-xl">
        <div className="container-x py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search burgers, pizza, drinks…"
                aria-label="Search the menu"
                className="w-full rounded-full border border-ink-900/10 bg-white py-2.5 pl-11 pr-10 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setParam('search', '');
                  }}
                  className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <SlidersHorizontal size={15} className="text-ink-400" />
              <select
                value={sort}
                onChange={(event) => setParam('sort', event.target.value)}
                aria-label="Sort products"
                className="rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink-700 shadow-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-600 shadow-sm sm:hidden"
              aria-label="Sort products"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 sm:hidden">
              <select
                value={sort}
                onChange={(event) => setParam('sort', event.target.value)}
                className="input"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setParam('category', 'all')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition',
                category === 'all'
                  ? 'bg-ink-900 text-cream-50 shadow-soft'
                  : 'border border-ink-900/10 bg-white text-ink-600 hover:border-ink-900/25'
              )}
            >
              All items
            </button>
            {categories.map((entry) => (
              <button
                key={entry._id}
                type="button"
                onClick={() => setParam('category', entry.slug)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition',
                  category === entry.slug
                    ? 'bg-ink-900 text-cream-50 shadow-soft'
                    : 'border border-ink-900/10 bg-white text-ink-600 hover:border-ink-900/25'
                )}
              >
                {entry.name}
                <span className={cn('ml-1.5 text-[10px] font-semibold', category === entry.slug ? 'text-cream-200' : 'text-ink-400')}>
                  {entry.productCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="container-x py-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">
            {loading ? 'Loading the kitchen…' : `${total} item${total === 1 ? '' : 's'}${activeCategory ? ` in ${activeCategory.name}` : ''}`}
            {search && !loading && <span className="text-ink-400"> · matching “{search}”</span>}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Clear all filters
            </button>
          )}
        </div>

        {error ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="The menu didn’t load"
            description={error}
            action={<Button onClick={reload}>Try again</Button>}
          />
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No dishes match that yet"
            description="Try a different search, or clear the filters to see the whole menu."
            action={
              <Button onClick={clearFilters} variant="outline">
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>

            {pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Menu pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setParam('page', page - 1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-600 transition hover:border-ink-900/25 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pages }).map((_, index) => {
                  const number = index + 1;
                  if (pages > 7 && Math.abs(number - page) > 2 && number !== 1 && number !== pages) return null;
                  return (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setParam('page', number)}
                      className={cn(
                        'h-10 min-w-10 rounded-full px-3 text-sm font-bold transition',
                        number === page
                          ? 'bg-brand-600 text-white shadow-glow'
                          : 'border border-ink-900/10 bg-white text-ink-600 hover:border-ink-900/25'
                      )}
                      aria-current={number === page ? 'page' : undefined}
                    >
                      {number}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setParam('page', page + 1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-600 transition hover:border-ink-900/25 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
