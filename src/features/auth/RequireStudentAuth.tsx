import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Guards private student routes. Public discovery routes (`/student/discover`,
 * placement detail) stay anonymous per the API's optional-auth model.
 */
export default function RequireStudentAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main role="status" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Loading your account…
      </main>
    )
  }
  if (status !== 'signed-in' || user?.role !== 'student') {
    return (
      <Navigate
        to="/auth/student/sign-in"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }
  return children
}
