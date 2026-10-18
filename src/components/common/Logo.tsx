import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Official fixth wordmark (68×29).
 *
 * The source SVG hard-codes `#0F35DB`; here the fill is `currentColor` so the
 * same mark works on the navy footer, the royal-blue band and the glow hero —
 * set the colour with a text utility on the element.
 *
 * The original `<clipPath>` is dropped: its rect matches the viewBox exactly,
 * so it clips nothing, and omitting it avoids duplicate DOM ids when the mark
 * is rendered more than once on a page.
 */
const WORDMARK_PATH =
  'M7.979 5.802l3.116 0 0 5.8-2.767 0.013c-1.528 0-2.767 1.295-2.767 2.893 0 1.598 1.24 2.893 2.767 2.893l2.767 0.013 0 5.8-3.116 0c-0.82642 0.00138-1.64753-0.13204-2.431-0.395l0 6.181-5.548 0 0-15.364 0.015 0c0.25-4.371 3.72-7.836 7.962-7.836l0.002 0.002z m36.079 0.38c0.78321-0.26252 1.60397-0.3956 2.43-0.394l3.117 0 0 5.8-2.767 0.013c-1.528 0-2.767 1.295-2.767 2.893 0 1.598 1.24 2.893 2.767 2.893l2.767 0.012 0 5.8-3.115 0-0.002 0.002c-4.242 0-7.712-3.464-7.962-7.835l-0.015 0 0-15.364 5.548 0-0.001 6.18z m-28.442 1.83c1.528 0 2.767 1.295 2.767 2.893l0 12.295-5.54601 0 0-12.295 0.01201 0c0-1.598 1.239-2.893 2.76699-2.893m21.154 3.587l-2.79 0.006-0.025 0.027c-1.515 0.014-2.739 1.297-2.742 2.877l0 0.007c0 1.593 1.24 2.883 2.767 2.883q0.127 0 0.25-0.012l2.53 0.012 0 5.8-3.141 0-0.038-0.012c-1.973-0.105-3.765-0.927-5.142-2.22-1.39721 1.32589-3.2198 2.11262-5.14299 2.22l-0.037 0.013-3.132-0.021 0-5.798 2.52 0.007c0.08311 0.00781 0.16652 0.01215 0.25 0.013 1.528 0 2.767-1.29 2.767-2.884l0-0.006c-0.003-1.582-1.227-2.863-2.741-2.877l-0.026-0.027-2.78 0.012 0-5.798 2.83 0 0.005 0.001 0.001-0.001c2.11 0.023 4.03 0.864 5.487 2.23 1.458-1.366 3.379-2.207 5.488-2.23l0.003-0.002 2.84-0.02-0.00101 5.8z m20.124-5.405c0.77583-0.25929 1.58801-0.39331 2.40601-0.397l0.74 0c4.398 0.013 7.96 3.74 7.96 8.336l0 9.067-5.55 0 0-8.702-0.013 0c0-1.594-1.235-2.888-2.762-2.891-1.527 0.003-2.762 1.297-2.76201 2.892l-0.01299 0 0 8.7-5.55 0 0-23.196 5.544 0-0.00001 6.191z m-41.277-6.192c1.528 0 2.767 1.295 2.767 2.893 0 1.598-1.239 2.893-2.767 2.893-1.528 0-2.767-1.296-2.767-2.893 0-1.598 1.24-2.893 2.767-2.893m35.733 0l-0.001 0 0.00101-0.002-0.00001 0.002z'

/** Bare wordmark, no accessibility affordances. Size and colour it yourself. */
export function FixthWordmark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 68 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      {...props}
      className={className}
    >
      <path d={WORDMARK_PATH} fill="currentColor" />
    </svg>
  )
}

const logoTones = {
  /** On the navy footer, the CTA band and the glow hero. */
  light: 'text-white',
  /** Official brand blue — for light surfaces such as the navbar pill. */
  brand: 'text-brand',
} as const

interface LogoProps {
  tone?: keyof typeof logoTones
  className?: string
}

/**
 * fixth logo. White on dark surfaces; use `tone="brand"` on light ones.
 * Reach for `<FixthWordmark>` directly if you need something else.
 */
export default function Logo({ tone = 'light', className }: LogoProps) {
  return (
    <span role="img" aria-label="fixth" className={cn('inline-flex', logoTones[tone], className)}>
      <FixthWordmark className="h-6 w-auto" />
    </span>
  )
}

