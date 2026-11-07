import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Guards the company workspace. Backend permissions remain authoritative; this
 * only avoids rendering company screens for signed-out or non-company accounts.
 */
export default function RequireCompanyAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main role="status" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Loading your organization…
      </main>
    )
  }
  if (status !== 'signed-in' || user?.role !== 'company') {
    return (
      <Navigate
        to="/auth/organization/sign-in"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }
  return children
}
