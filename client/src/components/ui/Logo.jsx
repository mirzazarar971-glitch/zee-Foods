import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

export default function Logo({ to = '/', light = false, compact = false, className }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="Zee Foods home">
      <span
        className={cn(
          'relative grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 shadow-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105',
          light && 'ring-1 ring-white/20'
        )}
      >
        <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" aria-hidden="true">
          <path
            d="M18 18h28L28.5 45H46"
            stroke="#FDFBF7"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="46" cy="18" r="5" fill="#F97316" />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            'font-display text-[21px] font-extrabold leading-none tracking-tight',
            light ? 'text-cream-50' : 'text-ink-900'
          )}
        >
          Zee <span className={light ? 'text-accent-400' : 'text-brand-600'}>Foods</span>
        </span>
      )}
    </Link>
  );
}
