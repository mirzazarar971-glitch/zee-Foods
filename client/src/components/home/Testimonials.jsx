import { Quote } from 'lucide-react';
import Stars from '../ui/Stars';

const TESTIMONIALS = [
  {
    quote:
      'The double smash burger is genuinely better than the big chains — juicy, messy and the Zee sauce is unreal. Delivery landed in 28 minutes, still hot.',
    name: 'Ayesha Khan',
    area: 'DHA Phase 6, Lahore',
    rating: 5,
    tag: 'AK',
    tone: '#C81E2E',
  },
  {
    quote:
      'Ordered the family feast for four people. Everything arrived warm, the wings were crispy and the kids demolished the fries. This is our Friday routine now.',
    name: 'Muhammad Saad',
    area: 'Gulberg III, Lahore',
    rating: 5,
    tag: 'MS',
    tone: '#EA580C',
  },
  {
    quote:
      'Zinger burger ek number — crunch bilkul fresh tha aur sauce bhi perfect. Order tracking bhi live update hoti rahi. Highly recommended!',
    name: 'Hira Zaidi',
    area: 'Johar Town, Lahore',
    rating: 4,
    tag: 'HZ',
    tone: '#87171F',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="eyebrow">Word on the street</p>
            <h2 className="section-title mt-2">
              Loved by <span className="text-brand-600">1,200+ foodies</span> across Lahore
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-ink-900/[0.06] bg-cream-50 px-5 py-3.5">
            <p className="font-display text-3xl font-extrabold text-ink-900">4.9</p>
            <div>
              <Stars value={5} size={13} />
              <p className="mt-1 text-[11px] font-medium text-ink-400">Average across 1,200+ orders</p>
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.name}
              className="relative flex h-full flex-col rounded-3xl border border-ink-900/[0.06] bg-cream-50/70 p-6 transition hover:border-brand-200 hover:bg-white hover:shadow-soft"
            >
              <Quote size={30} className="text-brand-200" />
              <blockquote className="mt-4 flex-1 text-[13.5px] leading-relaxed text-ink-600">&ldquo;{item.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-900/[0.06] pt-5">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: item.tone }}
                >
                  {item.tag}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink-900">{item.name}</p>
                  <p className="text-[11px] font-medium text-ink-400">{item.area}</p>
                </div>
                <Stars value={item.rating} size={11} />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
