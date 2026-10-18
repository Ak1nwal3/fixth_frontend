import type { ComponentType } from 'react'
import { Link } from 'react-router'

import type { MockupKind, PlatformFeature } from '@/features/landing/data'
import { cn } from '@/lib/utils'

import InternshipsMockup from './mockups/InternshipsMockup'
import PlacementsMockup from './mockups/PlacementsMockup'
import TrainingMockup from './mockups/TrainingMockup'

const mockups: Record<MockupKind, ComponentType> = {
  placements: PlacementsMockup,
  training: TrainingMockup,
  internships: InternshipsMockup,
}

interface FeatureRowProps {
  feature: PlatformFeature
  /** Puts the mockup on the right instead of the left. */
  flipped: boolean
}

/** One alternating mockup/copy row inside the royal-blue platform band. */
export default function FeatureRow({ feature, flipped }: FeatureRowProps) {
  const Mockup = mockups[feature.mockup]

  return (
    <div
      id={feature.id}
      className={cn(
        'reveal flex scroll-mt-28 flex-col items-center gap-10 lg:flex-row lg:gap-[60px]',
        flipped && 'lg:flex-row-reverse',
      )}
    >
      <div className="w-full shrink-0 lg:w-[380px]">
        <Mockup />
      </div>

      <div className="w-full space-y-4 lg:w-[340px] lg:shrink-0">
        <div className="space-y-2">
          <h3 className="text-lg font-medium tracking-[-0.03em] text-cream">{feature.title}</h3>
          <p className="text-sm tracking-[-0.03em] text-cream">{feature.description}</p>
        </div>
        <Link
          to="/onboarding/student/email"
          className="inline-block rounded-md bg-cream px-6 py-3 font-display text-sm font-medium tracking-[-0.05em] text-brand transition hover:bg-white"
        >
          {feature.cta}
        </Link>
      </div>
    </div>
  )
}
