import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface NoteCalloutProps {
  /** Leading affordance, usually a small brand-blue icon. */
  icon?: ReactNode
  children: ReactNode
  className?: string
}

/** Quiet grey reassurance strip above the primary action. */
export default function NoteCallout({ icon, children, className }: NoteCalloutProps) {
  return (
    <div className={cn('flex items-center gap-[7px] rounded-lg bg-note p-2.5', className)}>
      {icon}
      <p className="text-[13px] font-medium leading-[1.5] text-muted">{children}</p>
    </div>
  )
}
