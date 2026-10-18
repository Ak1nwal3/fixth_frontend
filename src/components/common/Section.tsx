import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SectionProps {
  /** Anchor target — the navbar links straight at these. */
  id?: string
  className?: string
  children: ReactNode
}

/**
 * A full-bleed band of the page.
 *
 * Vertical rhythm lives here; the horizontal constraint comes from a
 * `<Container />` inside it.
 */
export default function Section({ id, className, children }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-20 sm:py-28', className)}>
      {children}
    </section>
  )
}
