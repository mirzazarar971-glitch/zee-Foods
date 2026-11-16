import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Clock3, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from 'lucide-react';
import Logo from '../ui/Logo';
import { useSettings } from '../../context/SettingsContext';
import { cn, todayHours } from '../../lib/format';
import api from '../../lib/api';

const exploreLinks = [
  { label: 'Our menu', to: '/menu' },
  { label: 'Deals & offers', to: '/menu?category=deals' },
  { label: 'Track your order', to: '/track' },
  { label: 'My account', to: '/account' },
  { label: 'Cart', to: '/cart' },
];

export default function Footer() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const today = todayHours(settings.openingHours);
  const socials = settings.socials || {};

  const subscribe = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/newsletter', { email });
      toast.success(data.message || 'Subscribed!');
      setEmail('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mt-24 bg-ink-950 text-cream-100">
      <div className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_1.1fr_1.1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-100/60">
              Handcrafted burgers, stone-baked pizzas and crispy chicken — made fresh, delivered hot, loved across
              Lahore.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Zee Foods on Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-cream-100/70 transition hover:border-accent-400/50 hover:text-accent-400"
                >
                  <Facebook size={16} />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Zee Foods on Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-cream-100/70 transition hover:border-accent-400/50 hover:text-accent-400"
                >
                  <Instagram size={16} />
                </a>
              )}
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Zee Foods on YouTube"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-cream-100/70 transition hover:border-accent-400/50 hover:text-accent-400"
                >
                  <Youtube size={16} />
                </a>
              )}
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat with Zee Foods on WhatsApp"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-cream-100/70 transition hover:border-emerald-400/50 hover:text-emerald-400"
              >
                <MessageCircle size={16} />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-cream-100/50">
              <span className="rounded-full border border-white/10 px-2.5 py-1">100% Halal</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1">Cash on delivery</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1">Fresh daily</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-cream-100/40">Explore</h3>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="group inline-flex items-center gap-1.5 text-sm text-cream-100/65 transition hover:text-white">
                    {link.label}
                    <ArrowRight size={12} className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-cream-100/40">Contact</h3>
            <ul className="mt-5 space-y-3.5 text-sm text-cream-100/65">
              <li className="flex gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent-400" />
                <span>{settings.address}</span>
              </li>
              <li>
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 transition hover:text-white">
                  <Phone size={15} className="shrink-0 text-accent-400" />
                  {settings.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 transition hover:text-white">
                  <Mail size={15} className="shrink-0 text-accent-400" />
                  {settings.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-white"
                >
                  <MessageCircle size={15} className="shrink-0 text-accent-400" />
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-cream-100/40">Opening hours</h3>
            <ul className="mt-5 space-y-2 text-[13px]">
              {settings.openingHours?.map((entry) => (
                <li
                  key={entry.day}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-2 py-1',
                    today?.day === entry.day ? 'bg-white/[0.07] text-white' : 'text-cream-100/60'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {today?.day === entry.day && <Clock3 size={11} className="text-accent-400" />}
                    {entry.day}
                  </span>
                  <span className="tabular-nums">{entry.closed ? 'Closed' : `${entry.open} – ${entry.close}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Get deals before everyone else</h3>
            <p className="mt-1.5 text-sm text-cream-100/55">
              New menu drops, exclusive coupons and late-night offers. No spam, just cravings.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-white/15 bg-ink-900/60 px-5 py-3 text-sm text-white placeholder:text-cream-100/35 focus:border-accent-400 focus:outline-none focus:ring-4 focus:ring-accent-400/15"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-accent-400 disabled:opacity-60"
            >
              {submitting ? 'Joining…' : 'Subscribe'}
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-cream-100/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Zee Foods. All rights reserved.</p>
          <p>Crafted with fresh ingredients in Lahore, Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
