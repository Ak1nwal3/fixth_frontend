import Container from '@/components/common/Container'
import { hero } from '@/features/landing/data'

import HeroSearch from './HeroSearch'

export default function Hero() {
  return (
    <div className="pt-20 pb-28">
      <Container className="text-center">
        <div className="mx-auto inline-block border border-black/50 px-5 py-3">
          <h1 className="font-display text-[clamp(34px,5.2vw,64px)] font-medium uppercase leading-[clamp(31px,4.7vw,58px)] tracking-[-0.05em] text-cream">
            {hero.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </div>

        <p className="mt-4 text-sm font-medium tracking-[-0.05em] text-cream">
          {hero.subheadline}
        </p>

        <div className="mt-10">
          <HeroSearch />
        </div>
      </Container>
    </div>
  )
}
