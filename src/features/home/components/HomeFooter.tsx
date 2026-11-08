import { ArrowRight } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { InstagramIcon, LinkedInIcon, XIcon } from '@/components/common/BrandIcons'
import { FixthWordmark } from '@/components/common/Logo'
import { footerColumns } from '@/features/home/data'

import { SmartLink } from './shared'

const socials = [
  { label: 'X (Twitter)', Icon: XIcon },
  { label: 'LinkedIn', Icon: LinkedInIcon },
  { label: 'Instagram', Icon: InstagramIcon },
]

export default function HomeFooter() {
  const [subscribed, setSubscribed] = useState(false)

  // No newsletter backend yet; acknowledge locally.
  const onSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubscribed(true)
  }

  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent_70%)] opacity-[0.22] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-6 pb-8 pt-20 lg:px-10 lg:pt-24">
        <div className="grid items-end gap-10 border-b border-white/10 pb-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cyan/80">Stay in the loop</p>
            <h3 className="mt-4 max-w-[560px] font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[38px] lg:text-[44px]">
              Fresh placements, <em className="italic text-cyan">every week.</em>
            </h3>
            <p className="mt-3 max-w-[480px] text-[14.5px] text-white/60">
              One short email with new openings from verified companies. No noise, no spam, unsubscribe in a click.
            </p>
          </div>
          <div className="lg:col-span-5">
            <form onSubmit={onSubscribe} className="relative">
              <label htmlFor="home-nl" className="sr-only">
                Email
              </label>
              <input
                id="home-nl"
                type="email"
                required
                placeholder="you@school.edu.ng"
                className="h-14 w-full rounded-full bg-white/[0.06] pl-5 pr-[146px] text-[14.5px] text-white outline-none ring-1 ring-white/15 transition placeholder:text-white/35 focus:ring-cyan/40"
              />
              <button className="absolute right-1.5 top-1.5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-navy transition hover:bg-cyan-soft">
                Subscribe <ArrowRight className="size-[15px]" />
              </button>
            </form>
            <p role="status" className="mt-2.5 pl-1 text-[11.5px] text-white/40">
              {subscribed ? "Thanks — you're on the list." : "We'll never share your email."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-5 lg:gap-12">
          <div className="col-span-2 max-w-[320px]">
            <FixthWordmark className="h-8 w-auto text-cyan-soft" />
            <p className="mt-4 max-w-[280px] text-[13.5px] leading-[1.6] text-white/55">
              The trusted way to find SIWES, IT and internship placements in Nigeria.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{col.title}</p>
              <ul className="mt-5 space-y-3 text-[13.5px] text-white/80">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <SmartLink href={link.href} className="transition hover:text-cyan">
                      {link.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div aria-hidden className="relative -mb-2 overflow-hidden">
          <FixthWordmark className="block h-auto w-full text-white/[0.045]" />
        </div>

        <div className="relative flex flex-col items-center justify-between gap-3 pt-6 text-[12px] text-white/50 sm:flex-row">
          <p>© 2026 Fixth Technologies · Made in Lagos.</p>
          <div className="flex items-center gap-4">
            {socials.map(({ label, Icon }) => (
              <a key={label} href="#" aria-label={label} className="transition hover:text-cyan">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
