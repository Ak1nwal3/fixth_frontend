import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { howSteps } from '@/features/home/data'

/** How far apart (in SVG units) the two chains start before they connect. */
export const CHAIN_GAP = 420

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * A sticky panel inside a tall section: as you scroll through it the two
 * chains slide together, flash on contact, and the three steps rise in.
 */
export default function HowItWorks() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const sec = section.current
    if (!sec) return
    const q = <T extends Element>(s: string) => [...sec.querySelectorAll<T>(s)]
    const [left] = q<SVGGElement>('[data-chain-left]')
    const [right] = q<SVGGElement>('[data-chain-right]')
    const [halo] = q<SVGEllipseElement>('[data-halo]')
    const [match] = q<HTMLElement>('[data-match]')
    const sparks = q<SVGEllipseElement>('[data-spark]')
    const fades = q<HTMLElement>('[data-fade-out]')
    const steps = q<HTMLElement>('[data-step]')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0

    const render = () => {
      raf = 0
      const total = sec.offsetHeight - innerHeight
      const p = reduce.matches ? 1 : clamp(-sec.getBoundingClientRect().top / total)
      const t0 = clamp(p / 0.55)
      const off = CHAIN_GAP * (1 - t0 * t0 * (3 - 2 * t0))
      left.style.transform = `translateX(${-off}px)`
      right.style.transform = `translateX(${off}px)`

      const joined = clamp((p - 0.5) / 0.1)
      sparks.forEach((el) => el.setAttribute('opacity', (joined * 0.9).toFixed(3)))
      halo.setAttribute('opacity', (0.12 + joined * 0.38).toFixed(3))
      fades.forEach((el) => (el.style.opacity = (1 - joined).toFixed(3)))
      match.style.opacity = joined.toFixed(3)
      match.style.transform = `translateX(-50%) scale(${0.9 + 0.1 * joined})`

      steps.forEach((el, i) => {
        const t = easeOut(clamp((p - 0.58 - i * 0.07) / 0.15))
        el.style.opacity = t.toFixed(3)
        el.style.transform = `translateY(${(1 - t) * 16}px)`
      })
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render)
    }

    addEventListener('scroll', kick, { passive: true })
    addEventListener('resize', kick)
    reduce.addEventListener('change', kick)
    render()
    return () => {
      removeEventListener('scroll', kick)
      removeEventListener('resize', kick)
      reduce.removeEventListener('change', kick)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={section} id="how" className="home-brand-surface relative h-[240vh] text-white">
      <div className="home-grain sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-[1100px] px-6 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/85">How it works</p>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] lg:text-[52px]">
            Bridging <em className="italic text-cyan">the gap</em> between
            <br className="hidden sm:block" /> students and companies.
          </h2>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-[1100px] px-6 sm:mt-20">
          <div className="relative z-10 mb-4 flex h-8 items-center justify-between text-[13px] text-white/60 sm:mb-6 sm:text-[14px]">
            <span data-fade-out className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan" />
              Students
            </span>
            <span
              data-match
              style={{ transform: 'translateX(-50%) scale(.9)' }}
              className="absolute left-1/2 inline-flex h-8 items-center gap-2 rounded-lg bg-white px-3.5 font-semibold text-navy opacity-0"
            >
              <CircleCheck className="size-[15px] text-brand" />
              Placed.
            </span>
            <span data-fade-out className="inline-flex items-center gap-2">
              Companies
              <span className="size-1.5 rounded-full bg-cyan" />
            </span>
          </div>

          <svg data-how-chains viewBox="0 0 1033.6 129" className="block h-auto w-full overflow-visible" aria-hidden>
            <ellipse data-halo cx="516.8" cy="64" rx="260" ry="140" fill="url(#home-halo)" opacity=".12" />
            <g data-chain-left>
              <g clipPath="url(#home-chainL)">
                <rect x="-10" y="-10" width="540" height="150" fill="url(#home-fillL)" />
                <ellipse data-spark cx="516.8" cy="64" rx="110" ry="80" opacity="0" filter="url(#home-soft)" style={{ fill: 'var(--color-cyan)' }} />
              </g>
            </g>
            <g data-chain-right>
              <g clipPath="url(#home-chainR)">
                <rect x="507" y="-10" width="540" height="150" fill="url(#home-fillR)" />
                <ellipse data-spark cx="516.8" cy="64" rx="110" ry="80" opacity="0" filter="url(#home-soft)" style={{ fill: 'var(--color-cyan)' }} />
              </g>
            </g>
          </svg>
        </div>

        <ol className="relative mx-auto mt-10 grid w-full max-w-[1100px] gap-4 px-6 text-left sm:mt-20 sm:gap-8 md:grid-cols-3">
          {howSteps.map((step, i) => (
            <li key={step.title} data-step className="border-t border-white/25 pt-4 opacity-0 sm:pt-5" style={{ transform: 'translateY(16px)' }}>
              <span className="font-display text-[14px] font-semibold text-cyan">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 font-display text-[20px] font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-[15px] leading-snug text-white/75 [@media(max-height:720px)]:hidden">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
