import { ArrowRight, Check, Sparkles } from 'lucide-react'

import { companyPerks, companySteps, routes } from '@/features/home/data'

import { SmartLink } from './shared'

/** Hairline corner bracket on the CTA card. */
function Corner({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 60 60" fill="none" strokeWidth="1" className={`absolute size-16 stroke-cyan-soft opacity-60 ${className}`}>
      <path d="M0 1h30M1 0v30" />
      <circle cx="30" cy="30" r="2" className="fill-cyan-soft" />
    </svg>
  )
}

export default function ForCompanies() {
  return (
    <section id="companies" className="relative overflow-hidden bg-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent_70%)] opacity-[0.08] blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(closest-side,var(--color-navy),transparent_70%)] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[860px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">For companies</p>
          <h2 className="mt-4 font-display text-[36px] font-semibold leading-[1.04] tracking-[-0.03em] text-navy sm:text-[48px] lg:text-[60px]">
            Meet your next engineers
            <br className="hidden sm:block" /> <em className="italic text-brand">before they graduate.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.55] text-ink/60">
            Post a SIWES or internship role and hear from engineering students who fit it — the right discipline, the
            right level, close to your site.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 sm:gap-5 md:grid-cols-3 lg:mt-20">
          {companySteps.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-white p-6 ring-1 ring-ink/[0.06] lg:p-7">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-navy font-display text-[15px] font-semibold text-white">
                {i + 1}
              </span>
              <p className="mt-5 font-display text-[19px] font-semibold text-navy">{step.title}</p>
              <p className="mt-2 text-[14.5px] leading-snug text-ink/55">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="home-brand-surface home-grain relative isolate mt-16 overflow-hidden rounded-3xl px-8 py-12 text-white lg:mt-20 lg:px-14 lg:py-16">
          <Corner className="right-6 top-6" />
          <Corner className="bottom-6 left-6 rotate-180" />

          <div className="relative grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex h-7 items-center gap-2 rounded-full bg-white/[0.08] pl-1 pr-3 text-[12px] text-cyan ring-1 ring-white/15">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-cyan/20">
                  <Sparkles className="size-3 text-cyan" />
                </span>
                For companies
              </div>
              <h3 className="mt-4 font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[34px] lg:text-[40px]">
                Your next intern is
                <br className="sm:hidden" /> <em className="italic text-cyan">already looking.</em>
              </h3>
              <p className="mt-3 max-w-[520px] text-[15px] text-white/70">
                Post your first role in minutes and start hearing from engineering students this week.
              </p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/70">
                {companyPerks.map((perk) => (
                  <li key={perk} className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-cyan" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col lg:items-end lg:gap-4">
              <SmartLink
                href={routes.companySignUp}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-navy transition-colors hover:bg-cyan-soft"
              >
                Post a placement
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </SmartLink>
              <SmartLink
                href={`${routes.contact}?subject=Demo`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white/90 ring-1 ring-white/20 transition hover:bg-white/5"
              >
                Book a demo
              </SmartLink>
              <p className="hidden text-right text-[11.5px] text-white/50 lg:block">No fees, no contracts.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
