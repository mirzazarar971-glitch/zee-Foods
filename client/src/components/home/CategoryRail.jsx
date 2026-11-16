import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

function CategorySkeleton() {
  return (
    <div className="shrink-0 rounded-3xl border border-ink-900/[0.06] bg-white p-3 pr-5">
      <div className="skeleton h-16 w-16 rounded-2xl" />
      <div className="mt-3 skeleton h-3 w-16" />
    </div>
  );
}

export default function CategoryRail({ categories = [], loading }) {
  return (
    <section className="container-x py-12 sm:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Browse the menu</p>
          <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">What are you craving today?</h2>
        </div>
        <Link
          to="/menu"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          See everything
          <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 lg:grid-cols-10">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => <CategorySkeleton key={index} />)
          : categories.map((category) => (
              <Link
                key={category._id}
                to={`/menu?category=${category.slug}`}
                className="group shrink-0 rounded-3xl border border-ink-900/[0.06] bg-white p-2.5 pr-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card sm:block sm:p-3"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-cream-100 sm:h-auto sm:w-full sm:aspect-square">
                  <img
                    src={category.image || '/images/burger-classic.webp'}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/25 to-transparent" />
                </div>
                <div className="mt-2 sm:mt-3">
                  <p className="text-xs font-bold text-ink-800 transition group-hover:text-brand-600 sm:text-[13px]">
                    {category.name}
                  </p>
                  <p className="mt-0.5 hidden text-[10px] font-medium text-ink-400 sm:block">
                    {category.productCount} items
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
