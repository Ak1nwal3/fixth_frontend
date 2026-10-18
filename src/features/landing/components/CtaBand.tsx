import Container from '@/components/common/Container'
import Section from '@/components/common/Section'
import { Link } from 'react-router'
import { cta } from '@/features/landing/data'

export default function CtaBand() {
  return (
    <Section id="internship" className="bg-surface">
      <Container>
        <div className="card-grid reveal rounded-[40px] bg-navy px-6 py-16 text-center shadow-[0_6px_20px_rgba(0,0,0,0.1)] ring-1 ring-white/5 sm:py-20">
          <h2 className="mx-auto max-w-[956px] font-display text-[clamp(28px,3.4vw,48px)] font-medium leading-tight tracking-[-0.05em] text-cream">
            {cta.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-[672px] text-sm tracking-[-0.05em] text-cream">
            {cta.description}
          </p>
          <Link
            to="/onboarding/student/email"
            className="mt-8 inline-block rounded-md bg-brand px-7 py-3.5 font-display text-sm font-medium tracking-[-0.05em] text-cream transition hover:bg-brand-strong"
          >
            {cta.action}
          </Link>
        </div>
      </Container>
    </Section>
  )
}
