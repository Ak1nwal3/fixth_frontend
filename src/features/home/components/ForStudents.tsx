import { ArrowRight, Building2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { routes, studentMatches, type StudentMatch } from '@/features/home/data'
import { cn } from '@/lib/utils'

import { SmartLink, VerifiedBadge } from './shared'

const cardClass =
  'relative w-[300px] max-w-full rounded-2xl bg-cyan-soft p-4 text-navy shadow-[0_30px_60px_-30px_rgba(0,0,46,.75)]'

/** Each SVG carries its own gradient: one inside a `display: none` SVG won't paint. */
function ArrowGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--color-cyan-soft)', stopOpacity: 0.9 }} />
        <stop offset="1" style={{ stopColor: 'var(--color-cyan)', stopOpacity: 0.4 }} />
      </linearGradient>
    </defs>
  )
}

/** Dashed curve between two cards; mirrored for the right-hand flow. */
function Arrow({ id, className, flip }: { id: string; className: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className={cn('absolute hidden h-[120px] w-[120px] sm:block', flip && '-scale-x-100', className)}
    >
      <path data-draw d="M8 6 C 8 60, 80 60, 92 108" stroke={`url(#${id})`} strokeWidth="1.75" strokeLinecap="round" strokeDasharray="4 6" />
      <path d="M86 100 L92 110 L100 103" stroke={`url(#${id})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <ArrowGradient id={id} />
    </svg>
  )
}

/** Phone-width connector that swings from one side to the other. */
function MobileConnector({ id, toRight }: { id: string; toRight: boolean }) {
  const d = toRight ? 'M40 2 C 40 40, 180 20, 196 66' : 'M180 2 C 180 40, 40 20, 24 66'
  const head = toRight ? 'M188 60 L196 68 L205 61' : 'M32 60 L24 68 L15 61'
  const gid = `${id}-m`
  return (
    <div className="mb-2 mt-4 flex sm:hidden" aria-hidden>
      <svg viewBox="0 0 220 70" className="h-[64px] w-full" fill="none" preserveAspectRatio="none">
        <ArrowGradient id={gid} />
        <path d={d} stroke={`url(#${gid})`} strokeWidth="1.75" strokeLinecap="round" strokeDasharray="4 6" />
        <path d={head} stroke={`url(#${gid})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/** Student card → "Finding job match…" → company role card. */
function Flow({ match, mirrored }: { match: StudentMatch; mirrored: boolean }) {
  const key = mirrored ? 'b' : 'a'
  const start = mirrored ? 'ml-auto mr-0 sm:mr-6' : 'ml-0 sm:ml-6'
  const end = mirrored ? 'mr-auto ml-0 sm:ml-10' : 'ml-auto mr-0 sm:mr-10'

  return (
    <div data-flow className={cn('home-flow relative', mirrored && 'lg:mt-16')}>
      <article data-flow-item className={cn(cardClass, start, mirrored ? 'rotate-[2deg]' : '-rotate-[2deg]')}>
        <div className="flex items-center gap-3">
          <span className="relative inline-block size-11">
            <img
              src={match.student.photo}
              alt=""
              loading="lazy"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover ring-2 ring-white"
            />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-brand ring-2 ring-cyan-soft" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight">{match.student.name}</p>
            <p className="mt-0.5 text-[12.5px] leading-tight text-navy/60">{match.student.course}</p>
          </div>
        </div>
      </article>

      <Arrow
        id={`home-arr-${key}1`}
        flip={mirrored}
        className={mirrored ? 'right-[72px] top-[68px] sm:right-[96px]' : 'left-[72px] top-[68px] sm:left-[96px]'}
      />
      <MobileConnector id={`home-arr-${key}1`} toRight={!mirrored} />

      <div data-flow-item className={cn('relative mt-0 w-[300px] max-w-full sm:mt-[80px]', end)}>
        <div className="relative flex h-14 items-center justify-between overflow-hidden rounded-full bg-[linear-gradient(100deg,var(--color-brand-strong)_0%,var(--color-brand)_50%,var(--color-brand-strong)_100%)] pl-5 pr-3 shadow-[0_20px_40px_-20px_var(--color-brand-strong)] ring-1 ring-white/10">
          <span className="relative font-display text-[14px] font-medium italic text-white/90">Finding job match…</span>
          <span className="relative inline-flex size-9 items-center justify-center rounded-full bg-white/10">
            <svg
              className={cn('home-match-spin size-5 text-cyan', mirrored && 'home-match-spin-alt')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" strokeOpacity=".2" />
              <path d="M21 12a9 9 0 0 0-9-9" />
            </svg>
          </span>
          <span
            aria-hidden
            className={cn(
              'home-match-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent',
              mirrored && 'home-match-sheen-alt',
            )}
          />
        </div>
      </div>

      <Arrow
        id={`home-arr-${key}2`}
        flip={!mirrored}
        className={mirrored ? 'left-[72px] top-[220px] sm:left-[96px]' : 'right-[72px] top-[220px] sm:right-[96px]'}
      />
      <MobileConnector id={`home-arr-${key}2`} toRight={mirrored} />

      <article
        data-flow-item
        className={cn(cardClass, 'mt-0 w-[320px] sm:mt-[80px]', start, mirrored ? '-rotate-[1.5deg]' : 'rotate-[1.5deg]')}
      >
        <div className="flex items-center gap-2.5">
          {match.company.initial ? (
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-navy font-display text-[12px] font-semibold text-white">
              {match.company.initial}
            </span>
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white ring-1 ring-navy/10">
              <Building2 className="size-5 text-brand" />
            </span>
          )}
          <p className="text-[13.5px] font-semibold">{match.company.name}</p>
          <VerifiedBadge className="size-4 text-brand" />
        </div>
        <p className="mt-3 font-display text-[20px] font-semibold leading-tight">{match.role.title}</p>
        <p className="mt-1 text-[12.5px] text-navy/60">{match.role.meta}</p>
      </article>
    </div>
  )
}

export default function ForStudents() {
  const grid = useRef<HTMLDivElement>(null)

  // Each flow draws itself in once it scrolls into view.
  useEffect(() => {
    const flows = grid.current?.querySelectorAll('[data-flow]')
    if (!flows) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const items = e.target.querySelectorAll<HTMLElement>('[data-flow-item]')
          items.forEach((el, i) => (el.style.transitionDelay = `${i * 260}ms`))
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      { threshold: 0.25 },
    )
    flows.forEach((f) => io.observe(f))
    return () => io.disconnect()
  }, [])

  return (
    <section id="students" className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent_70%)] opacity-[0.28] blur-3xl" />
        <div className="absolute bottom-[-200px] left-[8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent_70%)] opacity-[0.22] blur-3xl" />
        <div className="absolute bottom-[-180px] right-[6%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,var(--color-cyan),transparent_70%)] opacity-[0.14] blur-3xl" />
        <div className="card-grid absolute inset-0 opacity-60 [background-size:56px_56px]" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-cyan/90">For students</p>
          <h2 className="mt-4 font-display text-[36px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[48px] lg:text-[60px]">
            We connect engineering students to <em className="italic text-cyan">real openings</em>
            <br className="hidden sm:block" /> from trusted companies.
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-[1.55] text-white/65">
            One verified profile, one tap to apply. Fixth routes it straight to a company that's actively hiring, then
            keeps you posted at every step.
          </p>
        </div>

        <div ref={grid} className="relative mt-16 grid items-start gap-14 lg:mt-24 lg:grid-cols-2 lg:gap-24">
          {studentMatches.map((match, i) => (
            <Flow key={match.student.name} match={match} mirrored={i % 2 === 1} />
          ))}
        </div>

        <div className="relative mt-20 flex flex-col items-center justify-center gap-4 sm:flex-row lg:mt-28">
          <SmartLink
            href={routes.studentSignUp}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-navy transition-colors hover:bg-cyan-soft"
          >
            Create your free profile <ArrowRight className="size-4" />
          </SmartLink>
          <SmartLink
            href={routes.discover}
            className="inline-flex h-12 items-center gap-2 px-5 text-[15px] font-semibold text-white/80 transition hover:text-white"
          >
            Browse all openings
          </SmartLink>
        </div>
      </div>
    </section>
  )
}
