import { trustLogos } from '@/features/home/data'
import { cn } from '@/lib/utils'

/** Logo wordmarks scrolling in a seamless loop (the list is rendered twice). */
export default function TrustMarquee() {
  const items = [...trustLogos, ...trustLogos]

  return (
    <section aria-label="Trusted by" className="relative bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-10 sm:py-14 lg:px-10">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/45">Trusted by</p>

        <div className="home-marquee relative mt-6 overflow-hidden sm:mt-8">
          <ul className="home-marquee-track flex w-max items-center gap-x-12 whitespace-nowrap text-navy/55 sm:gap-x-16">
            {items.map((logo, i) => (
              <li
                key={i}
                aria-hidden={i >= trustLogos.length || undefined}
                className={cn(
                  'font-display text-[18px] font-semibold tracking-[-0.02em] opacity-70 sm:text-[20px]',
                  logo.italic && 'italic',
                )}
              >
                {logo.name}
                {logo.mark && <span className="text-brand">{logo.mark}</span>}
                {logo.suffix && <span className="font-normal text-ink/40">{logo.suffix}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
