import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MockupFrameProps {
  className?: string
  children: ReactNode
}

/**
 * The navy 380×240 panel that every platform mockup sits in. Children are
 * positioned as percentages of the panel so the whole thing scales down.
 */
export default function MockupFrame({ className, children }: MockupFrameProps) {
  return (
    <div
      className={cn(
        'relative aspect-[380/240] w-full max-w-[380px] overflow-hidden rounded-[32px] bg-navy shadow-[0_6px_20px_rgba(0,0,0,0.1)]',
        className,
      )}
    >
      <div className="card-grid absolute inset-0 opacity-70" aria-hidden />
      {children}
    </div>
  )
}
