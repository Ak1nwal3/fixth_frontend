import { internshipChat } from '@/features/landing/data'

import MockupFrame from './MockupFrame'

/** Internships: a two-way conversation between a recruiter and a candidate. */
export default function InternshipsMockup() {
  const [recruiter, candidate] = internshipChat.photos

  return (
    <MockupFrame>
      <img
        src={recruiter}
        alt=""
        className="absolute left-[61%] top-[12.5%] h-[41.7%] w-[32.6%] rounded-[12px] object-cover"
      />
      <img
        src={candidate}
        alt=""
        className="absolute left-[8.7%] top-[45.8%] h-[41.7%] w-[32.6%] rounded-[16px] object-cover"
      />

      <p className="absolute left-[6.3%] top-[12.5%] w-[58.7%] rounded-[16px_16px_2px_16px] bg-content-faint px-3 py-3 text-[10px] font-medium leading-[1.2] tracking-[-0.03em] text-cream backdrop-blur-sm">
        {internshipChat.received}
      </p>

      <p className="absolute left-[35.8%] top-[70.4%] w-[36.3%] rounded-[2px_16px_16px_16px] bg-content-faint px-3 py-2.5 text-[10px] font-medium tracking-[-0.03em] text-cream backdrop-blur-sm">
        {internshipChat.sent}
      </p>
    </MockupFrame>
  )
}
