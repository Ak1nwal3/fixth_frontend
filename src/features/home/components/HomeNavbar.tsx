import { ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'

import Logo from '@/components/common/Logo'
import { navLinks, routes } from '@/features/home/data'

import { SmartLink } from './shared'

/** Transparent header laid over the hero, with a dropdown panel on mobile. */
export default function HomeNavbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="home-intro-nav absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:h-20 sm:px-6">
        <a href="#top" aria-label="Fixth home" className="rounded-md">
          <Logo tone="brand" className="[&>svg]:h-7 sm:[&>svg]:h-8" />
        </a>

        <nav className="hidden items-center gap-9 text-[15px] text-ink/60 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-navy">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SmartLink
            href={routes.signIn}
            className="hidden h-10 items-center rounded-lg border border-brand-line bg-brand-soft px-4 text-[15px] font-semibold text-brand transition-colors hover:border-brand sm:inline-flex"
          >
            Sign in
          </SmartLink>
          <SmartLink
            href={routes.studentSignUp}
            className="hidden h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-semibold text-white transition-colors hover:bg-brand-strong sm:inline-flex"
          >
            Get started <ArrowRight className="size-4" />
          </SmartLink>
          <button
            type="button"
            aria-controls="home-mnav"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-lg bg-white/80 text-navy ring-1 ring-ink/[0.08] backdrop-blur md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="home-mnav" className="px-5 md:hidden">
          <div className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,46,.05),0_30px_60px_-30px_rgba(0,0,46,.25)] ring-1 ring-ink/[0.08]">
            <nav className="flex flex-col text-[15px]">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="border-b border-line px-5 py-3.5 font-medium text-navy last:border-0 hover:bg-cream"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2 border-t border-line bg-cream/60 p-4">
              <SmartLink
                href={routes.signIn}
                onClick={close}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-[14px] font-semibold text-brand"
              >
                Sign in
              </SmartLink>
              <SmartLink
                href={routes.studentSignUp}
                onClick={close}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand text-[14px] font-semibold text-white"
              >
                Get started <ArrowRight className="size-4" />
              </SmartLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
