import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({ eyebrow, title, description, crumbs = [], children }) {
  return (
    <section className="relative overflow-hidden border-b border-ink-900/[0.06] bg-cream-100">
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="container-x relative py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-ink-400">
          <Link to="/" className="transition hover:text-brand-600">
            Home
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight size={12} />
              {crumb.to ? (
                <Link to={crumb.to} className="transition hover:text-brand-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-600">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h1 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
