import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ContainerProps {
  /** Element to render. Defaults to `div`. */
  as?: ElementType
  className?: string
  children: ReactNode
}

/**
 * Centres content and applies the shared responsive gutter.
 *
 * The design lays out at 1440px with 105px margins, so the content column is
 * 1230px wide. Backgrounds belong to the full-bleed band around this, so
 * `Container` only handles the horizontal constraint.
 */
export default function Container({ as: Tag = 'div', className, children }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full max-w-[1230px] px-5 sm:px-8', className)}>{children}</Tag>
}
