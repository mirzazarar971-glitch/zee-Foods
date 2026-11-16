import { motion } from 'framer-motion';
import { ArrowRight, Bike, Clock3, Flame, ShieldCheck, Star } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { formatPKR, todayHours } from '../../lib/format';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Hero() {
  const { settings } = useSettings();
  const hours = todayHours(settings.openingHours);

  return (
    <section className="relative overflow-hidden bg-cream-100">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 left-1/3 h-[28rem] w-[28rem] rounded-full bg-accent-400/15 blur-3xl" />

      <div className="container-x relative grid items-center gap-12 pb-14 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:pb-24 lg:pt-14">
        <div>
          <motion.div {...fade(0)} className="flex flex-wrap items-center gap-2">
            <span className="chip bg-white text-brand-700 ring-1 ring-brand-200/70 shadow-sm">
              <Flame size={13} className="text-accent-500" /> Lahore&apos;s late-night favourite
            </span>
            <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck size={13} /> 100% halal
            </span>
          </motion.div>

          <motion.h1 {...fade(0.08)} className="mt-6 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl xl:text-[72px]">
            Cravings?{' '}
            <span className="relative whitespace-nowrap text-brand-600">
              We&apos;ve Got
              <svg className="absolute -bottom-2 left-0 h-3 w-full text-accent-400" viewBox="0 0 220 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 9C50 3 130 2 218 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{' '}
            You Covered!
          </motion.h1>

          <motion.p {...fade(0.16)} className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-500 sm:text-base">
            Smashed burgers, stone-baked pizzas, crunchy zingers and loaded fries — cooked fresh to order and
            delivered hot across Lahore. Skip the queue, order in a couple of taps.
          </motion.p>

          <motion.div {...fade(0.24)} className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/menu" size="lg" className="group">
              Order now
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button to="/menu?category=deals" variant="outline" size="lg">
              Explore menu
            </Button>
          </motion.div>

          <motion.div {...fade(0.32)} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['AK', 'MS', 'HZ', 'FR'].map((tag, index) => (
                  <span
                    key={tag}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-cream-100 text-[10px] font-bold text-white"
                    style={{ background: ['#C81E2E', '#EA580C', '#87171F', '#3D332E'][index] }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={13} className="fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-ink-600">
                  4.9 from 1,200+ happy foodies
                </p>
              </div>
            </div>
            <div className="h-9 w-px bg-ink-900/10" />
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <Clock3 size={16} className="text-brand-600" />
              Avg. {settings.deliveryTimeMins} min delivery
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <div className="blob absolute inset-4 rotate-6 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 opacity-95" />
          <div className="blob absolute inset-8 -rotate-3 border-[3px] border-dashed border-ink-900/15" />
          <div className="relative aspect-square overflow-hidden rounded-[46%_54%_48%_52%/50%_46%_54%_50%] shadow-card">
            <img
              src="/images/hero-burger.webp"
              alt="Zee Foods signature double smash burger"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="absolute -left-3 top-8 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:-left-8"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Bike size={19} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-900">Free delivery</p>
              <p className="text-[11px] font-medium text-ink-500">
                on orders over {formatPKR(settings.freeDeliveryThreshold)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute -bottom-2 right-0 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:-right-6"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-bold text-ink-900">
                {hours && !hours.closed ? `Open now · till ${hours.close}` : 'Opens soon'}
              </p>
            </div>
            <p className="mt-1 text-[11px] font-medium text-ink-500">Kitchen is firing on all burners</p>
          </motion.div>

          <div className="absolute -right-2 -top-2 grid h-24 w-24 rotate-12 place-items-center rounded-full bg-accent-500 text-center shadow-glow sm:-right-4 sm:h-28 sm:w-28">
            <div className="animate-float">
              <p className="font-display text-2xl font-extrabold leading-none text-ink-950">ZEE</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-950/70">Since 2019</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative overflow-hidden border-y border-ink-900/10 bg-brand-600 py-3 text-white">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.2em]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-8" aria-hidden={copy === 1}>
              {[
                'Flame-grilled daily',
                'Stone-baked pizza',
                '100% halal ingredients',
                'Free delivery over Rs 2,500',
                'Late-night kitchen',
                'Loved in Lahore',
              ].map((item) => (
                <span key={item} className="flex items-center gap-8">
                  {item}
                  <Star size={10} className="fill-accent-300 text-accent-300" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
