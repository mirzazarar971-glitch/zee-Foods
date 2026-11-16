import { Link } from 'react-router-dom';
import { ArrowLeft, Bike, ShieldCheck, Star } from 'lucide-react';
import Logo from '../ui/Logo';

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <section className="grid min-h-[calc(100vh-68px)] lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <img
          src="/images/hero-burger.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-ink-950/60 to-brand-900/70" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo light />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-400">Welcome to Zee Foods</p>
            <h2 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-tight text-white xl:text-5xl">
              Good food, hot delivery, zero hassle.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/60">
              Create an account to save addresses, reorder your favourites in one tap and follow every order live.
            </p>
            <div className="mt-8 flex flex-wrap gap-5 text-xs font-semibold text-cream-100/70">
              <span className="flex items-center gap-2">
                <Bike size={15} className="text-accent-400" /> 35 min delivery
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-accent-400" /> Secure account
              </span>
              <span className="flex items-center gap-2">
                <Star size={15} className="fill-accent-400 text-accent-400" /> 4.9 rated
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
            <p className="text-sm leading-relaxed text-cream-100/75">
              “Ordering takes seconds and the tracking is actually accurate. Zee Foods has replaced every other takeaway
              app in our house.”
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-cream-100/40">Bilal R. · Gulberg III</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-cream-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-ink-500 transition hover:text-brand-600">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-ink-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-xs font-medium text-ink-500">{footer}</div>}
        </div>
      </div>
    </section>
  );
}
