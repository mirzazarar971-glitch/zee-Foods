import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import { ProductCardSkeleton } from '../ui/Field';

export default function FeaturedGrid({ products = [], loading }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-x">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <p className="eyebrow">Chef&apos;s picks</p>
            <h2 className="section-title mt-2">
              Featured, fresh and <span className="text-brand-600">impossible to resist</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Our kitchen team&apos;s favourites — stacked burgers, loaded sides and stone-baked pizza made from scratch
              every single day.
            </p>
          </div>
          <Link
            to="/menu"
            className="group inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-cream-50 px-5 py-3 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
          >
            View full menu
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)
            : products.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
        </div>
      </div>
    </section>
  );
}
