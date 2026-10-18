import { candidates, candidateStageLabel } from '@/features/landing/data'

import MockupFrame from './MockupFrame'

/** Industrial Training: the candidate pipeline with signed-off hires. */
export default function TrainingMockup() {
  return (
    <MockupFrame>
      <div className="absolute left-[11.7%] top-[15.2%] h-[69.6%] w-[76.6%] rounded-[20px] bg-cyan-soft p-[5%] shadow-[0_6px_20px_rgba(0,0,0,0.1)] ring-1 ring-cream">
        <ul className="flex h-full flex-col justify-between">
          {candidates.map((candidate, index) => (
            <li key={candidate.name}>
              <div className="flex items-center gap-1.5">
                <img
                  src={candidate.avatar}
                  alt=""
                  className="size-[28px] shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium tracking-[-0.03em] text-ink">
                    {candidate.name}
                  </p>
                  <p className="truncate text-[11px] tracking-[-0.03em] text-ink">
                    {candidate.field}
                  </p>
                </div>
                <span className="shrink-0 rounded-[20px] bg-ink/10 px-2.5 py-0.5 text-[11px] font-medium tracking-[-0.03em] text-ink/70">
                  {candidateStageLabel}
                </span>
              </div>

              {index < candidates.length - 1 && (
                <div
                  className="mt-2 border-t border-dashed border-ink/20"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </MockupFrame>
  )
}
