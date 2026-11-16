import { cn } from '../../lib/format';

const TONES = {
  neutral: 'bg-cream-100 text-ink-600 ring-1 ring-ink-900/5',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  accent: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  dark: 'bg-ink-900 text-cream-50',
};

export default function Badge({ children, tone = 'neutral', className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
