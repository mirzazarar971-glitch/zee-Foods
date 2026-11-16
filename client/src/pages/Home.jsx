import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import api from '../lib/api';
import usePageTitle from '../hooks/usePageTitle';
import Hero from '../components/home/Hero';
import CategoryRail from '../components/home/CategoryRail';
import FeaturedGrid from '../components/home/FeaturedGrid';
import BestSellers from '../components/home/BestSellers';
import DealsBand from '../components/home/DealsBand';
import WhyChoose from '../components/home/WhyChoose';
import Testimonials from '../components/home/Testimonials';
import VisitUs from '../components/home/VisitUs';

const initial = { featured: [], popular: [], categories: [], coupons: [], loading: true, error: '' };

export default function Home() {
  usePageTitle('');
  const [state, setState] = useState(initial);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const [featuredRes, popularRes, categoryRes, couponRes] = await Promise.all([
        api.get('/products', { params: { featured: true, limit: 8 } }),
        api.get('/products', { params: { popular: true, limit: 5 } }),
        api.get('/categories'),
        api.get('/coupons/active'),
      ]);
      setState({
        featured: featuredRes.data.items || [],
        popular: popularRes.data.items || [],
        categories: categoryRes.data.categories || [],
        coupons: couponRes.data.coupons || [],
        loading: false,
        error: '',
      });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Hero />
      {state.error && (
        <div className="container-x pt-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2.5 text-sm font-medium text-amber-800">
              <WifiOff size={17} /> We could not load today&apos;s menu. {state.error}
            </p>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-amber-50 transition hover:bg-amber-950"
            >
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        </div>
      )}
      <CategoryRail categories={state.categories} loading={state.loading} />
      <FeaturedGrid products={state.featured.slice(0, 8)} loading={state.loading} />
      <BestSellers products={state.popular} loading={state.loading} />
      <DealsBand coupons={state.coupons} />
      <WhyChoose />
      <Testimonials />
      <VisitUs />
    </>
  );
}
