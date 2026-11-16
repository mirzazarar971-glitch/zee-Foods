import { Link } from 'react-router-dom';
import { ArrowRight, Home, UtensilsCrossed } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/ui/Button';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <section className="container-x flex min-h-[62vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[88px] font-extrabold leading-none tracking-tight text-brand-600/15 sm:text-[130px]">
        404
      </p>
      <span className="-mt-6 grid h-16 w-16 place-items-center rounded-3xl bg-white text-brand-600 shadow-card">
        <UtensilsCrossed size={28} />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-ink-900">This page is off the menu</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
        The link may be broken or the page has moved. Let&apos;s get you back to something delicious.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button to="/">
          <Home size={15} /> Back to home
        </Button>
        <Button to="/menu" variant="outline">
          Browse the menu <ArrowRight size={15} />
        </Button>
      </div>
      <p className="mt-6 text-[11px] text-ink-400">
        Looking for an order?{' '}
        <Link to="/track" className="font-bold text-brand-600 hover:text-brand-700">
          Track it here
        </Link>
      </p>
    </section>
  );
}
