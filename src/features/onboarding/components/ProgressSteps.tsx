import { cn } from '@/lib/utils'

interface ProgressStepsProps {
  /** Total number of segments in the track. */
  total: number
  /** 1-based index of the active segment. */
  current: number
  className?: string
}

/**
 * Segmented tracker above the step caption.
 *
 * Completed and active segments are brand blue; the remainder sit on the light
 * `track` grey. Purely presentational — the accessible value lives on the
 * `progressbar` role.
 */
export default function ProgressSteps({ total, current, className }: ProgressStepsProps) {
  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cn('flex gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('h-[3px] flex-1 rounded-[2px]', index < current ? 'bg-brand' : 'bg-track')}
        />
      ))}
    </div>
  )
}
