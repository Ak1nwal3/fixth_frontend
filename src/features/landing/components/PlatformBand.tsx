import { onePlatform } from '@/assets'

/**
 * The royal-blue band: the section heading with the exported platform artwork
 * — placements, training and internships, top to bottom — sitting below it.
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

          <img
            src={onePlatform}
            alt="SIWES placements, industrial training and internships on the fixth platform"
            width={820}
            height={920}
            className="mx-auto mt-20 w-full"
          />
        </div>
      </div>
    </section>
  )
}
