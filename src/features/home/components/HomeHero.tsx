import { ArrowRight, BookOpen, ChevronDown, CircleCheck, MapPin, Search } from 'lucide-react'
import type { CSSProperties, FormEvent, RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import {
  disciplines,
  heroPoints,
  locations,
  popularDisciplines,
  routes,
  searchExamples,
} from '@/features/home/data'

import { SmartLink } from './shared'

const delay = (s: number) => ({ '--delay': `${s}s` }) as CSSProperties

const prefersMotion = () => matchMedia('(prefers-reduced-motion: no-preference)').matches

/** Types example searches into the placeholder until the user takes over. */
function useTypingPlaceholder(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const el = input.current
    if (!el || !prefersMotion()) return
    const base = el.placeholder
    let i = 0
    let n = 0
    let deleting = false
    let timer = 0

    const tick = () => {
      if (document.activeElement === el || el.value !== '') {
        el.placeholder = base
        return
      }
      const text = searchExamples[i]
      n += deleting ? -1 : 1
      el.placeholder = text.slice(0, n) || '​'
      let wait = deleting ? 28 : 55 + Math.random() * 45
      if (!deleting && n === text.length) {
        deleting = true
        wait = 1900
      } else if (deleting && n === 0) {
        deleting = false
        i = (i + 1) % searchExamples.length
        wait = 450
      }
      timer = window.setTimeout(tick, wait)
    }
    const onFocus = () => {
      clearTimeout(timer)
      el.placeholder = base
    }
    const onBlur = () => {
      if (el.value) return
      n = 0
      deleting = false
      clearTimeout(timer)
      timer = window.setTimeout(tick, 600)
    }

    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)
    timer = window.setTimeout(tick, 2200)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
      el.placeholder = base
    }
  }, [input])
}

/**
 * Pointer effects on fine pointers: a spotlight that reveals the brand pattern,
 * and a slight parallax on the side chains. The content also eases back and
 * fades as the hero scrolls away.
 */
function useHeroMotion(
  hero: RefObject<HTMLElement | null>,
  spot: RefObject<HTMLDivElement | null>,
  content: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const root = hero.current
    if (!root || !prefersMotion()) return
    const cleanups: Array<() => void> = []

    let scrollRaf = 0
    const onScroll = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        const p = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / root.offsetHeight))
        if (content.current) {
          content.current.style.transform = `translateY(${p * 90}px)`
          content.current.style.opacity = String(1 - p * 0.85)
        }
      })
    }
    addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => removeEventListener('scroll', onScroll), () => cancelAnimationFrame(scrollRaf))

    if (matchMedia('(pointer: fine)').matches) {
      const ptrs = [...root.querySelectorAll<HTMLElement>('[data-ptr]')]
      const reach = [
        [22, 14],
        [12, 8],
      ]
      let tx = 0
      let ty = 0
      let x = 0
      let y = 0
      let raf = 0
      const step = () => {
        x += (tx - x) * 0.14
        y += (ty - y) * 0.14
        spot.current?.style.setProperty('--mx', `${x.toFixed(1)}px`)
        spot.current?.style.setProperty('--my', `${y.toFixed(1)}px`)
        raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(step) : 0
      }
      const move = (e: PointerEvent) => {
        const r = root.getBoundingClientRect()
        tx = e.clientX - r.left
        ty = e.clientY - r.top
        if (spot.current && !spot.current.classList.contains('is-on')) {
          x = tx
          y = ty
          spot.current.classList.add('is-on')
        }
        if (!raf) raf = requestAnimationFrame(step)
        const nx = e.clientX / innerWidth - 0.5
        const ny = e.clientY / innerHeight - 0.5
        ptrs.forEach((el, i) => {
          el.style.transform = `translate(${nx * reach[i][0]}px, ${ny * reach[i][1]}px)`
        })
      }
      const leave = () => spot.current?.classList.remove('is-on')
      root.addEventListener('pointermove', move)
      root.addEventListener('pointerleave', leave)
      cleanups.push(() => {
        root.removeEventListener('pointermove', move)
        root.removeEventListener('pointerleave', leave)
        cancelAnimationFrame(raf)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [hero, spot, content])
}

function SideChain({ side }: { side: 'left' | 'right' }) {
  const left = side === 'left'
  return (
    <div data-chain={side} className={`absolute inset-0 ${left ? 'home-chain-in-l' : 'home-chain-in-r'}`}>
      <div data-ptr className="absolute inset-0 transition-transform duration-[1200ms] ease-out">
        <svg
          viewBox="0 0 518.8 129"
          className={`absolute w-[520px] -rotate-[30deg] opacity-[0.12] ${left ? 'left-[-250px] top-[360px]' : 'right-[-270px] top-[210px]'}`}
        >
          <g clipPath="url(#home-chain4)" className={`home-chain-drift ${left ? '' : 'home-chain-alt'}`}>
            <rect width="518.8" height="129" fill={`url(#home-fill-${left ? 'a' : 'b'})`} />
            <ellipse
              className={`home-chain-sheen ${left ? '' : 'home-chain-alt'}`}
              cx="260"
              cy={left ? 40 : 90}
              rx="130"
              ry="70"
              opacity=".85"
              filter="url(#home-soft)"
              style={{ fill: 'var(--color-cyan)' }}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}

const selectClass =
  'w-full cursor-pointer appearance-none bg-transparent pr-5 text-[15px] text-ink outline-none'

export default function HomeHero() {
  const navigate = useNavigate()
  const hero = useRef<HTMLElement>(null)
  const spot = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  useTypingPlaceholder(input)
  useHeroMotion(hero, spot, content)

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    for (const key of ['q', 'discipline', 'location']) {
      const value = String(data.get(key) ?? '').trim()
      if (value) params.set(key, value)
    }
    const qs = params.toString()
    navigate(qs ? `${routes.discover}?${qs}` : routes.discover)
  }

  return (
    <section ref={hero} id="top" className="home-hero-bg relative overflow-hidden">
      <div ref={spot} aria-hidden className="home-spotlight pointer-events-none absolute inset-0">
        <div className="home-spotlight-glow absolute inset-0" />
        <div className="home-spotlight-pattern absolute inset-0" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[1440px] -translate-x-1/2 xl:block"
      >
        <SideChain side="left" />
        <SideChain side="right" />
      </div>

      <div ref={content} className="relative mx-auto max-w-[1080px] px-6 pb-20 pt-32 text-center lg:px-10 lg:pt-36">
        <SmartLink
          href={routes.discover}
          className="home-intro group inline-flex h-10 items-center gap-3 rounded-lg border border-ink/[0.07] bg-white/70 pl-1.5 pr-4 text-[14px] text-ink/75 shadow-[0_1px_2px_rgba(0,0,46,.05),0_8px_24px_-12px_rgba(0,0,46,.15)] backdrop-blur transition-colors hover:border-ink/15 hover:text-ink"
        >
          <span className="inline-flex h-7 items-center rounded-md bg-brand px-2.5 text-[12px] font-semibold tracking-wide text-white">
            New
          </span>
          <span className="tracking-[-0.01em]">Every SIWES opening, in one place</span>
          <ArrowRight className="size-[15px] text-ink/40 transition group-hover:translate-x-0.5 group-hover:text-brand" />
        </SmartLink>

        <h1 className="mt-8 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.04em] text-navy sm:text-[60px] lg:text-[80px]">
          <span className="-mx-[0.08em] -mb-[0.12em] block overflow-hidden px-[0.08em] pb-[0.12em]">
            <span className="home-intro-line block" style={delay(0.3)}>
              Find your SIWES
            </span>
          </span>
          <span className="-mx-[0.08em] -mb-[0.12em] block overflow-hidden px-[0.08em] pb-[0.12em]">
            <span className="home-intro-line block" style={delay(0.42)}>
              placement, <em className="whitespace-nowrap pr-1 font-semibold italic text-brand">stress-free.</em>
            </span>
          </span>
        </h1>

        <p
          className="home-intro mx-auto mt-7 max-w-[560px] text-[18px] leading-[1.5] text-ink/65 sm:text-[20px]"
          style={delay(0.75)}
        >
          Verified openings. Apply with one profile. Track every step.
        </p>

        <form
          role="search"
          onSubmit={onSearch}
          style={{ ...delay(0.9), '--rise': '24px' } as CSSProperties}
          className="home-intro mx-auto mt-10 flex max-w-[780px] flex-col rounded-xl bg-white p-2 text-left shadow-[0_1px_2px_rgba(0,0,46,.04),0_20px_44px_-24px_rgba(0,0,46,.28)] ring-1 ring-ink/[0.07] transition-shadow focus-within:ring-brand/30 md:flex-row md:items-center md:p-1.5"
        >
          <label className="flex h-14 min-w-0 items-center gap-3 pl-4 pr-3 md:h-[52px] md:flex-1 md:pl-5">
            <Search className="size-[19px] shrink-0 text-ink/40" />
            <span className="sr-only">Search</span>
            <input
              ref={input}
              type="text"
              name="q"
              aria-label="Search roles, skills or companies"
              placeholder="Search roles, skills or companies"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/40"
            />
          </label>

          <span className="hidden h-6 w-px bg-ink/10 md:block" />

          <label className="relative flex h-14 cursor-pointer items-center gap-2.5 border-t border-ink/[0.06] px-4 md:h-[52px] md:w-[176px] md:border-0">
            <BookOpen className="size-[18px] shrink-0 text-ink/40" />
            <span className="sr-only">Discipline</span>
            <select name="discipline" defaultValue="" className={selectClass}>
              <option value="">Discipline</option>
              {disciplines.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-ink/40" />
          </label>

          <span className="hidden h-6 w-px bg-ink/10 md:block" />

          <label className="relative flex h-14 cursor-pointer items-center gap-2.5 border-t border-ink/[0.06] px-4 md:h-[52px] md:w-[156px] md:border-0">
            <MapPin className="size-[18px] shrink-0 text-ink/40" />
            <span className="sr-only">Location</span>
            <select name="location" defaultValue="" className={selectClass}>
              <option value="">Location</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-ink/40" />
          </label>

          <button
            type="submit"
            className="mt-1 inline-flex h-[52px] items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-strong md:ml-1 md:mt-0"
          >
            Search <ArrowRight className="size-[17px]" />
          </button>
        </form>

        <div
          className="home-intro mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px]"
          style={delay(1.1)}
        >
          <span className="text-ink/40">Popular</span>
          {popularDisciplines.map((d) => (
            <SmartLink
              key={d}
              href={`${routes.discover}?discipline=${encodeURIComponent(d)}`}
              className="text-ink/65 transition hover:text-brand"
            >
              {d}
            </SmartLink>
          ))}
        </div>

        <p className="home-intro mt-6 text-[14px] text-muted" style={delay(1.18)}>
          Hiring students?{' '}
          <SmartLink href={routes.companySignUp} className="font-medium text-brand transition hover:text-brand-strong">
            Post a placement on Fixth →
          </SmartLink>
        </p>

        <ul
          className="home-intro mx-auto mt-10 flex max-w-[880px] flex-wrap justify-center gap-x-8 gap-y-3 border-t border-ink/[0.06] pt-8 text-[14px] text-ink/60"
          style={delay(1.26)}
        >
          {heroPoints.map((point) => (
            <li key={point} className="inline-flex items-center gap-2">
              <CircleCheck className="size-4 text-brand" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
