import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

export function LoadingBlock({ className }) {
  return <div className={cn('skeleton h-24 w-full', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-white shadow-soft">
      <div className="skeleton aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-brand-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn('input', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('input min-h-[100px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cn('input appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled = false, id }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span className="h-6 w-11 rounded-full bg-ink-200 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">{description}</span>}
      </span>
    </label>
  );
}
