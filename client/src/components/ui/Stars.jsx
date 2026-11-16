import { Star } from 'lucide-react';
import { cn } from '../../lib/format';

export default function Stars({ value = 0, size = 14, className, showValue = false, count = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rounded ? 'fill-accent-400 text-accent-400' : 'fill-ink-200 text-ink-200'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-semibold text-ink-500">
          {(Number(value) || 0).toFixed(1)}
          {count > 0 && <span className="font-medium text-ink-400"> ({count})</span>}
        </span>
      )}
    </span>
  );
}
