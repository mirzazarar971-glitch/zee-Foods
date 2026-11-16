import { cn } from '../../lib/format';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-900/15 bg-white/60 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-cream-100 text-ink-400">
          <Icon size={28} />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
