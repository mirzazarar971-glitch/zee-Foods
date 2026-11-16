import { PAYMENT_STATUS_META, STATUS_META } from '../../lib/orders';
import { cn } from '../../lib/format';

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
        meta.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }) {
  const meta = PAYMENT_STATUS_META[status] || PAYMENT_STATUS_META.pending;
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1', meta.className, className)}
    >
      {meta.label}
    </span>
  );
}
