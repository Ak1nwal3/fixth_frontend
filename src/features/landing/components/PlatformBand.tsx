import { platformFeatures } from '@/features/landing/data'

import FeatureRow from './FeatureRow'

/**
 * The royal-blue band: the section heading followed by the three feature rows —
 * placements, training and internships. Each row is rendered from real markup
 * (rather than the exported flat image) so its call to action is a working link.
 */
export default function PlatformBand() {
  return (
    <section id="companies" className="bg-brand">
      {/* Dashed frame, inset 20px from the band edges. */}
      <div className="frame-dashed mx-4 py-20 sm:mx-5">
        <div className="mx-auto w-full max-w-[780px] px-2">
          <h2 className="reveal text-center font-display text-[clamp(22px,2.4vw,32px)] font-medium tracking-[-0.05em] text-cream">
            One platform, every engineering opportunity.
          </h2>

          <div className="mt-20 flex flex-col gap-16 sm:gap-20">
            {platformFeatures.map((feature, index) => (
              <FeatureRow key={feature.id} feature={feature} flipped={index % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
