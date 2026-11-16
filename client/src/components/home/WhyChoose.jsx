import { Bike, ChefHat, ShieldCheck, Wallet } from 'lucide-react';

const FEATURES = [
  {
    icon: ChefHat,
    title: 'Cooked to order',
    description: 'Nothing sits under a lamp. Every burger is smashed, every pizza is stretched after you tap order.',
    tone: 'brand',
  },
  {
    icon: Bike,
    title: 'Hot, fast delivery',
    description: 'Insulated bags and our own riders keep the food at kitchen temperature all the way to your door.',
    tone: 'default',
  },
  {
    icon: ShieldCheck,
    title: '100% halal, fresh daily',
    description: 'Locally sourced meat, vegetables prepped every morning and zero shortcuts on quality.',
    tone: 'default',
  },
  {
    icon: Wallet,
    title: 'Pay your way',
    description: 'Cash on delivery, or request a secure online payment link when you checkout. No hidden charges.',
    tone: 'default',
  },
];

export default function WhyChoose() {
  return (
    <section className="container-x py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow justify-center">Why Zee Foods</p>
        <h2 className="section-title mt-3">
          More than fast food — <span className="text-brand-600">a proper feed</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          We built Zee Foods around one idea: takeaway food should taste like it was made for you, because it was.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={
              feature.tone === 'brand'
                ? 'relative overflow-hidden rounded-3xl bg-brand-600 p-6 text-white shadow-glow'
                : 'rounded-3xl border border-ink-900/[0.06] bg-white p-6 shadow-soft'
            }
          >
            {feature.tone === 'brand' && (
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            )}
            <span
              className={
                feature.tone === 'brand'
                  ? 'grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white'
                  : 'grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600'
              }
            >
              <feature.icon size={20} />
            </span>
            <h3 className={feature.tone === 'brand' ? 'mt-5 font-display text-lg font-bold text-white' : 'mt-5 font-display text-lg font-bold text-ink-900'}>
              {feature.title}
            </h3>
            <p className={feature.tone === 'brand' ? 'mt-2 text-[13px] leading-relaxed text-white/75' : 'mt-2 text-[13px] leading-relaxed text-ink-500'}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
