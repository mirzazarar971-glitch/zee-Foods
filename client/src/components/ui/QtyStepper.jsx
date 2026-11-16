import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/format';

export default function QtyStepper({ value, onChange, min = 1, max = 20, className, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-ink-900/10 bg-white p-1 shadow-sm', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn('grid place-items-center rounded-full text-ink-600 transition hover:bg-cream-100 disabled:opacity-35', dimensions)}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className={cn('min-w-8 text-center text-sm font-bold tabular-nums', size === 'sm' && 'text-xs')}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn('grid place-items-center rounded-full text-ink-600 transition hover:bg-cream-100 disabled:opacity-35', dimensions)}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
