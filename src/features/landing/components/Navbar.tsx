import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import Container from '@/components/common/Container'
import Logo from '@/components/common/Logo'
import { navLinks } from '@/features/landing/data'

interface NavItemProps {
  href: string
  label: string
  className?: string
  onClick?: () => void
}

/**
 * In-page anchors stay plain `<a>`; app routes become router links so the
 * marketing page is not reloaded when entering the onboarding flow.
 */
function NavItem({ href, label, className, onClick }: NavItemProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {label}
      </Link>
    )
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {label}
    </a>
  )
}

/**
 * Floating header.
 *
 * The design pins an 800×54 light capsule 12px from the top, so it lives in
 * flow inside the hero band and rides along until the hero scrolls away.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-3 z-50">
      <Container>
        <nav className="mx-auto flex h-[54px] w-full max-w-[800px] items-center justify-between gap-4 rounded-[10px] bg-cream pl-4 pr-2 shadow-lg shadow-black/25">
          <a href="#top" className="shrink-0 rounded-md" aria-label="Fixth home">
            <Logo tone="brand" />
          </a>

          <ul className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <NavItem
                  href={link.href}
                  label={link.label}
                  className="text-[13px] font-medium tracking-[-0.03em] text-navy/75 transition hover:text-navy"
                />
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/auth/sign-in"
              className="hidden rounded-md px-2 py-2 text-[13px] font-medium tracking-[-0.03em] text-navy/75 transition hover:text-navy sm:block"
            >
              Log in
            </Link>
            <Link
              to="/onboarding/student/email"
              className="rounded-md bg-brand px-4 py-2 text-[13px] font-medium tracking-[-0.03em] text-cream transition hover:bg-brand-strong"
            >
              Sign up
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label="Toggle navigation menu"
              className="grid size-8 place-items-center rounded-md text-navy transition hover:bg-navy/5 md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <ul className="mx-auto mt-2 w-full max-w-[800px] space-y-1 rounded-[10px] bg-cream p-2 shadow-lg shadow-black/25 md:hidden">
            {[...navLinks, { label: 'Log in', href: '/auth/sign-in' }].map((link) => (
              <li key={link.href}>
                <NavItem
                  href={link.href}
                  label={link.label}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-[13px] font-medium tracking-[-0.03em] text-navy/75 transition hover:bg-navy/5 hover:text-navy"
                />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </header>
  )
}
