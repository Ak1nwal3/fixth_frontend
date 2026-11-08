import { useEffect, useRef } from 'react'

import { CHAIN_GAP } from './HowItWorks'

const LEN = 516.8
const HOW_VB = 1033.6
const HERO_VB = 518.8
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Scrolling from the hero to "How it works", the two hero side chains fly
 * down, spin level and land where the how-it-works chains start. Proxies on a
 * fixed layer do the travelling; the real chains are hidden while they do.
 * Desktop only (the hero chains are hidden below `xl`).
 */
export default function ChainHandoff() {
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = layer.current
    const page = el?.parentElement
    const how = page?.querySelector<HTMLElement>('#how')
    const howSvg = how?.querySelector<SVGSVGElement>('[data-how-chains]')
    const howInner = how?.firstElementChild
    if (!el || !page || !how || !howSvg || !howInner) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')

    const sides = (['left', 'right'] as const).map((side) => {
      const wrap = page.querySelector<HTMLElement>(`[data-chain="${side}"]`)!
      const proxy = el.querySelector<HTMLElement>(`[data-proxy="${side}"]`)!
      return {
        wrap,
        heroPtr: wrap.querySelector<HTMLElement>('[data-ptr]')!,
        heroSvg: wrap.querySelector<SVGSVGElement>('svg')!,
        heroDrift: wrap.querySelector<SVGGElement>('.home-chain-drift')!,
        proxy,
        fa: proxy.querySelector('[data-fa]')!,
        fb: proxy.querySelector('[data-fb]')!,
        drift: proxy.querySelector<SVGGElement>('[data-drift]')!,
        howG: how.querySelector<SVGGElement>(side === 'left' ? '[data-chain-left]' : '[data-chain-right]')!,
        unitsX: side === 'left' ? -CHAIN_GAP + LEN / 2 : LEN + CHAIN_GAP + LEN / 2,
        // Mirrored full turn on the way down; both end level.
        spin: side === 'left' ? 390 : -330,
      }
    })

    const show = (heroVisible: boolean | null) => {
      el.style.display = 'none'
      sides.forEach((s) => {
        s.heroPtr.style.opacity = heroVisible === false ? '0' : ''
        s.howG.style.opacity = heroVisible === true ? '0' : ''
      })
    }

    let raf = 0
    const frame = () => {
      raf = 0
      if (reduce.matches || sides[0].heroSvg.getClientRects().length === 0) return show(null)

      const end = how.offsetTop
      const t = clamp(scrollY / end)
      if (t <= 0) return show(true)
      if (t >= 1) return show(false)

      el.style.display = 'block'
      const e = smooth(t)
      const sr = howSvg.getBoundingClientRect()
      const k = sr.width / HOW_VB
      const relY = sr.top - howInner.getBoundingClientRect().top

      for (const s of sides) {
        s.heroPtr.style.opacity = '0'
        s.howG.style.opacity = '0'

        const hr = s.heroSvg.getBoundingClientRect()
        const kh = parseFloat(getComputedStyle(s.heroSvg).width) / HERO_VB
        const hx = hr.left + hr.width / 2
        const hy = hr.top + hr.height / 2 + scrollY
        const tx = sr.left + s.unitsX * k
        const ty = end + relY + (129 / 2) * k

        const cx = hx + (tx - hx) * e
        const cy = hy + (ty - hy) * (1 - Math.pow(1 - t, 3)) - scrollY
        const w = LEN * kh + (LEN * k - LEN * kh) * e
        const h = (w * 129) / LEN

        s.proxy.style.width = `${w}px`
        s.proxy.style.height = `${h}px`
        const rot = -30 + s.spin * e
        const pop = 1 + 0.12 * Math.sin(Math.PI * e)
        s.proxy.style.transform = `translate(${cx - w / 2}px, ${cy - h / 2}px) rotate(${rot}deg) scale(${pop})`
        s.proxy.style.opacity = (0.12 + 0.88 * smooth(clamp(t / 0.85))).toFixed(3)

        const fb = smooth(clamp((t - 0.5) / 0.4))
        s.fb.setAttribute('opacity', fb.toFixed(3))
        s.fa.setAttribute('opacity', (1 - fb).toFixed(3))

        const m = new DOMMatrixReadOnly(getComputedStyle(s.heroDrift).transform)
        s.drift.style.transform = `translateX(${(m.e * (1 - e)).toFixed(2)}px)`
      }
      raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    addEventListener('scroll', kick, { passive: true })
    addEventListener('resize', kick)
    reduce.addEventListener('change', kick)
    kick()
    return () => {
      removeEventListener('scroll', kick)
      removeEventListener('resize', kick)
      reduce.removeEventListener('change', kick)
      cancelAnimationFrame(raf)
      show(null)
    }
  }, [])

  const proxy = (side: 'left' | 'right') => (
    <div data-proxy={side} className="absolute left-0 top-0 origin-center will-change-transform">
      <svg viewBox="0 0 516.8 129" className="block h-full w-full overflow-visible">
        <g data-drift>
          <g clipPath="url(#home-chain4)">
            <rect data-fa x="0" y="-10" width="516.8" height="150" fill={`url(#home-fill-${side === 'left' ? 'a' : 'b'})`} />
            <rect data-fb x="0" y="-10" width="516.8" height="150" fill={`url(#home-lum${side === 'left' ? 'L' : 'R'})`} opacity="0" />
          </g>
        </g>
      </svg>
    </div>
  )

  return (
    <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden" style={{ display: 'none' }}>
      {proxy('left')}
      {proxy('right')}
    </div>
  )
}
