import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import Container from '@/components/common/Container'
import Logo from '@/components/common/Logo'

export default function NotFoundPage() {
  return (
    <main className="glow-hero flex min-h-svh flex-col">
      <Container className="pt-8">
        <Link to="/" aria-label="fixth home" className="inline-block">
          <Logo />
        </Link>
      </Container>

      <Container className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-6xl font-extrabold text-white sm:text-7xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">This page does not exist</h1>
        <p className="mt-3 max-w-md text-content-muted">
          The link may be broken, or the page may have moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
      </Container>
    </main>
  )
}
