import { midSection } from '@/assets'
import Container from '@/components/common/Container'
import Section from '@/components/common/Section'

export default function TrustSection() {
  return (
    <Section id="students" className="bg-surface">
      <Container>
        <h2 className="reveal mx-auto max-w-[1042px] text-center font-display text-[clamp(22px,2.4vw,32px)] font-medium tracking-[-0.05em] text-cream">
          We connect you to opportunities from trusted engineering companies
        </h2>

        {/* Exported artwork: candidate → match → role, both flows in one SVG. */}
        <img
          src={midSection}
          alt="Two engineering students matched to internship roles at trusted Nigerian engineering companies"
          width={1000}
          height={382}
          className="reveal mx-auto mt-16 w-full max-w-[1000px] md:mt-24"
        />
      </Container>
    </Section>
  )
}
