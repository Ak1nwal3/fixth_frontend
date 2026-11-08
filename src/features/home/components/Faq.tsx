import { ArrowRight, Bell, Plus } from 'lucide-react'
import { useState } from 'react'

import { faqs, routes } from '@/features/home/data'
import { cn } from '@/lib/utils'

/** Accordion that keeps one answer open at a time. */
export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="relative overflow-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent_70%)] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1100px] gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-32">
        <aside className="self-start lg:sticky lg:top-24 lg:col-span-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">FAQ</p>
          <h2 className="mt-4 font-display text-[36px] font-semibold leading-[1.03] tracking-[-0.03em] text-navy lg:text-[46px]">
            Questions,
            <br />
            <em className="italic text-brand">answered.</em>
          </h2>
          <p className="mt-5 max-w-[360px] text-[16px] leading-[1.55] text-ink/60">
            Still unsure? Drop us a line and a real person on the Fixth team gets back within a day.
          </p>
          <div className="mt-7 rounded-2xl border border-line bg-cream/70 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand text-white">
                <Bell className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-navy">Can't find your answer?</p>
                <p className="text-[12px] text-ink/55">We reply to every message.</p>
              </div>
            </div>
            <a
              href={routes.contact}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-[14px] font-semibold text-white transition hover:bg-ink"
            >
              hello@fixth.ng <ArrowRight className="size-[15px]" />
            </a>
          </div>
        </aside>

        <ul className="divide-y divide-line lg:col-span-8">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q} className="py-5">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`home-faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-6 text-left font-display text-[18px] font-semibold tracking-[-0.01em] text-navy sm:text-[19px]"
                  >
                    {item.q}
                    <span
                      className={cn(
                        'inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition',
                        isOpen ? 'border-brand bg-brand text-white' : 'border-line bg-cream text-ink/60',
                      )}
                    >
                      <Plus className={cn('size-4 transition-transform', isOpen && 'rotate-45')} strokeWidth={2.4} />
                    </span>
                  </button>
                </h3>
                <div id={`home-faq-${i}`} hidden={!isOpen} className="pr-14 pt-3 text-[15px] leading-[1.6] text-ink/65">
                  {item.a}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
