import { Clock3, MapPin, MessageCircle, Phone, UtensilsCrossed } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { cn, todayHours } from '../../lib/format';

export default function VisitUs() {
  const { settings } = useSettings();
  const today = todayHours(settings.openingHours);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${settings.restaurantName}, ${settings.address}`
  )}`;

  return (
    <section className="container-x pb-4 pt-16 sm:pt-20">
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 px-6 py-10 text-white shadow-card sm:px-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-ink-950/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-10 dot-grid" />

        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-200">
              <UtensilsCrossed size={14} /> Visit the kitchen
            </p>
            <h2 className="mt-4 max-w-lg text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Open late, seven days a week. Come hungry.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Dine in, collect at the counter or get it delivered across Lahore. Kitchen timings are the same for all
              three — no exceptions.
            </p>

            <div className="mt-7 space-y-3.5 text-sm">
              <p className="flex items-start gap-3 text-white/85">
                <MapPin size={17} className="mt-0.5 shrink-0 text-accent-200" />
                {settings.address}, {settings.city}
              </p>
              <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-white/85 transition hover:text-white">
                <Phone size={17} className="shrink-0 text-accent-200" />
                {settings.phone}
              </a>
              {today && (
                <p className="flex items-center gap-3 text-white/85">
                  <Clock3 size={17} className="shrink-0 text-accent-200" />
                  Today: {today.closed ? 'Closed' : `${today.open} – ${today.close}`}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={mapsUrl} target="_blank" rel="noreferrer" variant="light">
                Get directions
              </Button>
              <Button
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/15"
              >
                <MessageCircle size={16} /> WhatsApp us
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-ink-900 shadow-card sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold">Opening hours</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {today && !today.closed ? 'Open today' : 'Closed today'}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-ink-900/[0.06]">
              {settings.openingHours?.map((entry) => (
                <li
                  key={entry.day}
                  className={cn(
                    'flex items-center justify-between gap-4 py-2.5 text-[13px]',
                    today?.day === entry.day ? 'font-bold text-ink-900' : 'text-ink-500'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {today?.day === entry.day && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                    {entry.day}
                  </span>
                  <span className="tabular-nums">{entry.closed ? 'Closed' : `${entry.open} – ${entry.close}`}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button to="/menu" size="sm">
                Order pickup
              </Button>
              <Button to="/track" variant="outline" size="sm">
                Track order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
