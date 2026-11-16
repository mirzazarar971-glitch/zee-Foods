import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '../../lib/format';

export function AdminHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-2xl font-extrabold text-ink-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  ink: 'bg-ink-100 text-ink-700',
  violet: 'bg-violet-50 text-violet-600',
};

export function StatCard({ icon: Icon, label, value, hint, accent = 'brand' }) {
  return (
    <div className="rounded-2xl border border-ink-900/[0.06] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        {Icon && (
          <span className={cn('grid h-9 w-9 place-items-center rounded-xl', ACCENTS[accent] || ACCENTS.brand)}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] font-medium text-ink-400">{hint}</p>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-900/10 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-ink-800 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
      />
    </div>
  );
}

export function Pagination({ page = 1, pages = 0, onChange, total }) {
  if (pages <= 1) {
    return total !== undefined ? (
      <p className="text-[11px] font-medium text-ink-400">{total} result{total === 1 ? '' : 's'}</p>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && (
        <p className="text-[11px] font-medium text-ink-400">
          Page {page} of {pages} · {total} total
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-lg border border-ink-900/10 bg-white text-ink-500 transition hover:border-ink-900/25 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }).map((_, index) => {
          const number = index + 1;
          if (pages > 7 && Math.abs(number - page) > 2 && number !== 1 && number !== pages) return null;
          return (
            <button
              key={number}
              type="button"
              onClick={() => onChange(number)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-[11px] font-bold transition',
                number === page ? 'bg-ink-900 text-cream-50' : 'border border-ink-900/10 bg-white text-ink-500 hover:border-ink-900/25'
              )}
            >
              {number}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="grid h-8 w-8 place-items-center rounded-lg border border-ink-900/10 bg-white text-ink-500 transition hover:border-ink-900/25 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('rounded-2xl border border-ink-900/[0.06] bg-white shadow-soft', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-900/[0.06] px-5 py-4">
          <div>
            {title && <h2 className="font-display text-sm font-bold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[11px] text-ink-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function TableShell({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-soft', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }) {
  return (
    <th className={cn('border-b border-ink-900/[0.06] bg-cream-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-400', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }) {
  return <td className={cn('border-b border-ink-900/[0.04] px-4 py-3 text-ink-600', className)}>{children}</td>;
}

export function TableEmpty({ colSpan, title, description }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="font-display text-sm font-bold text-ink-800">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-ink-400">{description}</p>}
      </td>
    </tr>
  );
}

export function StatusToggle({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 transition',
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100' : 'bg-ink-50 text-ink-400 ring-ink-200 hover:bg-ink-100'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-ink-400')} />
      {children}
    </button>
  );
}
