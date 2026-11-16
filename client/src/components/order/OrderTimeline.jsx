import { Check, XCircle } from 'lucide-react';
import { ORDER_STEPS } from '../../lib/orders';
import { cn, formatDate, formatTime } from '../../lib/format';

export default function OrderTimeline({ status, history = [], className }) {
  if (status === 'cancelled') {
    const cancellation = [...history].reverse().find((entry) => entry.status === 'cancelled');
    return (
      <div className={cn('rounded-2xl border border-rose-200 bg-rose-50/80 p-5', className)}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
            <XCircle size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-rose-800">This order was cancelled</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-600">
              {cancellation?.note || 'The order was cancelled. Contact us if you need help with a refund or a new order.'}
            </p>
            {cancellation?.at && <p className="mt-2 text-[11px] font-medium text-rose-500">{formatDate(cancellation.at)}</p>}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(0, ORDER_STEPS.findIndex((step) => step.key === status));
  const historyMap = Object.fromEntries((history || []).map((entry) => [entry.status, entry]));
  const progress = (currentIndex / (ORDER_STEPS.length - 1)) * 100;

  return (
    <div className={className}>
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute left-[8.33%] right-[8.33%] top-5 h-1 rounded-full bg-ink-900/[0.07]" />
          <div
            className="absolute left-[8.33%] top-5 h-1 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-700"
            style={{ width: `calc(${progress}% * 0.8333)` }}
          />
          <div className="relative grid grid-cols-6">
            {ORDER_STEPS.map((step, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;
              const entry = historyMap[step.key];
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center px-1 text-center">
                  <span
                    className={cn(
                      'relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 bg-white transition-all duration-500',
                      done && 'border-brand-600 bg-brand-600 text-white',
                      active && 'border-brand-600 text-brand-600 ring-4 ring-brand-500/15',
                      !done && !active && 'border-ink-200 text-ink-300'
                    )}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                  </span>
                  <p
                    className={cn(
                      'mt-2.5 text-[11px] font-bold leading-tight',
                      active ? 'text-ink-900' : done ? 'text-ink-600' : 'text-ink-400'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-ink-400">
                    {entry?.at ? formatTime(entry.at) : active ? 'In progress' : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {ORDER_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const entry = historyMap[step.key];
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative flex gap-3.5 pb-6 last:pb-0">
              {index < ORDER_STEPS.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[19px] top-10 h-[calc(100%-2rem)] w-0.5',
                    done ? 'bg-brand-500' : 'bg-ink-200'
                  )}
                />
              )}
              <span
                className={cn(
                  'z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 bg-white',
                  done && 'border-brand-600 bg-brand-600 text-white',
                  active && 'border-brand-600 text-brand-600 ring-4 ring-brand-500/15',
                  !done && !active && 'border-ink-200 text-ink-300'
                )}
              >
                {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
              </span>
              <div className="pt-1">
                <p className={cn('text-sm font-bold', active ? 'text-ink-900' : done ? 'text-ink-600' : 'text-ink-400')}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {entry?.at ? formatDate(entry.at) : active ? step.description : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
