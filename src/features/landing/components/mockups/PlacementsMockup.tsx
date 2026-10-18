import { jobCards } from '@/features/landing/data'

import MockupFrame from './MockupFrame'

/**
 * SIWES Placements: a rail of verified job cards that is deliberately wider
 * than the panel, so the outer cards are clipped by the rounded frame.
 */
export default function PlacementsMockup() {
  return (
    <MockupFrame>
      {/* 821px rail inside a 380px panel → 216% of the frame. */}
      <div className="absolute left-1/2 top-[29.2%] flex w-[216%] -translate-x-1/2 gap-[1.95%]">
        {jobCards.map((card, index) => (
          <article
            key={`${card.company}-${card.role}-${index}`}
            className="w-[32.03%] rounded-[20px] bg-cyan-soft px-[7%] py-[6%] shadow-[0_6px_20px_rgba(0,0,0,0.1)] ring-1 ring-cream"
          >
            <div className="flex items-center gap-1.5">
              <img src={card.logo} alt="" className="size-6 shrink-0 rounded-full" />
              <p className="truncate font-display text-[13px] font-medium tracking-[-0.03em] text-ink">
                {card.company}
              </p>
              <svg
                viewBox="0 0 12 12"
                className="size-3 shrink-0 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 10 10 2M4 2h6v6" />
              </svg>
            </div>

            <p className="mt-1 truncate font-display text-base font-medium tracking-[-0.03em] text-ink">
              {card.role}
            </p>

            <div className="mt-1 flex items-center gap-1.5 text-xs tracking-[-0.03em] text-ink">
              <span className="truncate">{card.location}</span>
              <span className="size-0.5 shrink-0 rounded-full bg-ink" aria-hidden />
              <span className="truncate">{card.contract}</span>
            </div>
          </article>
        ))}
      </div>
    </MockupFrame>
  )
}
