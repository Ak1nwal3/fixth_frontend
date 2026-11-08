import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * In-page anchors and mailto links stay plain `<a>`; app routes become router
 * links so the page is not reloaded when entering the product.
 */
export function SmartLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

/** Scalloped verified seal used on company and student cards. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Verified" role="img">
      <path
        fill="currentColor"
        d="M12 1l2.4 2L18 2.4 18.6 6l3 .6-.6 3.6L24 12l-2 2.4.6 3.6-3.6.6L18 22l-3.6-.6L12 24l-2.4-2L6 22.6 5.4 19l-3.6-.6.6-3.6L0 12l2-2.4L1.4 6 5 5.4 6 2l3.6.6z"
      />
      <path fill="white" d="M10.5 15.5l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z" />
    </svg>
  )
}

/** The "x" from the fixth mark; four of them chained make the brand pattern. */
const X_GLYPH =
  'M229 43.0009L207.275 43.0459L207.074 43.2463C195.28 43.3515 185.747 52.8593 185.724 64.5738V64.6224C185.724 76.4312 195.374 85.9985 207.275 85.9985C207.93 85.9985 208.576 85.9631 209.221 85.9049L228.916 85.9985V128.999H204.459L204.165 128.905C188.796 128.124 174.844 122.032 164.115 112.452C153.399 122.032 139.435 128.124 124.065 128.905L123.771 128.999L99.3818 128.848V85.8596L119.009 85.9178C119.642 85.976 120.302 86.0114 120.959 86.0114C132.858 86.0104 142.506 76.4405 142.506 64.632V64.5867C142.482 52.8603 132.95 43.3611 121.155 43.2559L120.959 43.0591L99.301 43.1494V0.164729H121.343L121.379 0.174419L121.391 0.164729C137.817 0.340065 152.779 6.57103 164.128 16.699C175.478 6.57066 190.437 0.339767 206.864 0.164729L206.887 0.151809L229 0V43.0009Z'

const stop = (offset: string, color: string, opacity?: number) => (
  <stop offset={offset} style={{ stopColor: `var(--color-${color})`, stopOpacity: opacity }} />
)

/**
 * Shared SVG defs for the chain artwork (hero, how-it-works and the scroll
 * handoff between them). Rendered once per page; colours are brand tokens.
 */
export function ChainDefs() {
  const chain = (id: string, xs: number[]) => (
    <clipPath id={id}>
      {xs.map((x) => (
        <use key={x} href="#home-xg" x={x} />
      ))}
    </clipPath>
  )
  const left = [-99.3, 29.9, 159.1, 288.3]

  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <path id="home-xg" d={X_GLYPH} />
        {chain('home-chain4', left)}
        {chain('home-chainL', left)}
        {chain('home-chainR', [417.5, 546.7, 675.9, 805.1])}

        <linearGradient id="home-fill-a" x1="0" y1="0" x2="1" y2="0">
          {stop('0', 'navy')}
          {stop('.55', 'brand-strong')}
          {stop('1', 'brand')}
        </linearGradient>
        <linearGradient id="home-fill-b" x1="0" y1="0" x2="1" y2="0">
          {stop('0', 'brand')}
          {stop('.45', 'brand-strong')}
          {stop('1', 'navy')}
        </linearGradient>

        <linearGradient id="home-fillL" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="517" y2="0">
          {stop('0', 'cyan', 0)}
          {stop('.45', 'cyan', 0.55)}
          {stop('1', 'cyan-soft', 0.95)}
        </linearGradient>
        <linearGradient id="home-fillR" gradientUnits="userSpaceOnUse" x1="517" y1="0" x2="1034" y2="0">
          {stop('0', 'cyan-soft', 0.95)}
          {stop('.55', 'cyan', 0.55)}
          {stop('1', 'cyan', 0)}
        </linearGradient>
        <linearGradient id="home-lumL" x1="0" y1="0" x2="1" y2="0">
          {stop('0', 'cyan', 0)}
          {stop('.45', 'cyan', 0.55)}
          {stop('1', 'cyan-soft', 0.95)}
        </linearGradient>
        <linearGradient id="home-lumR" x1="0" y1="0" x2="1" y2="0">
          {stop('0', 'cyan-soft', 0.95)}
          {stop('.55', 'cyan', 0.55)}
          {stop('1', 'cyan', 0)}
        </linearGradient>
        <radialGradient id="home-halo">
          {stop('0', 'cyan', 0.55)}
          {stop('1', 'cyan', 0)}
        </radialGradient>

        <filter id="home-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
    </svg>
  )
}
