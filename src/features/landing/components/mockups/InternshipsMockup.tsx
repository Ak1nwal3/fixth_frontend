import { internshipsMockup } from '@/assets'

import MockupFrame from './MockupFrame'

/** Internships: a two-way conversation between a recruiter and a candidate. */
export default function InternshipsMockup() {
  return (
    <MockupFrame>
      <img
        src={internshipsMockup}
        alt="A recruiter messaging a candidate to arrange an internship call"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </MockupFrame>
  )
}
