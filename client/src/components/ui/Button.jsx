import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-glow hover:bg-brand-700',
  dark: 'bg-ink-900 text-cream-50 hover:bg-ink-800',
  outline: 'border border-ink-900/15 bg-white/70 text-ink-900 backdrop-blur hover:border-ink-900/30 hover:bg-white',
  ghost: 'text-ink-700 hover:bg-ink-900/5',
  accent: 'bg-accent-500 text-ink-950 hover:bg-accent-400',
  light: 'bg-white text-ink-900 hover:bg-cream-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-3.5 text-[15px]',
  icon: 'h-10 w-10 p-0',
};

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className
  );

  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
