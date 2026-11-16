import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'
import { roleHome } from './roles'

/**
 * The marketing home page is for signed-out visitors. A signed-in student or
 * organization opening the site goes straight to their workspace.
 */
export function HomeGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const home = status === 'signed-in' ? roleHome(user?.role) : null
  if (home) return <Navigate to={home} replace />
  return children
}

/**
 * The student area (including public Discover) belongs to students. Someone
 * signed in as an organization who opens a /student URL is sent to the
 * student sign-in instead of seeing a student page with organization details.
 * Signing in there replaces the organization session. Signed-out visitors can
 * still browse public discovery pages.
 */
export function StudentAreaGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const location = useLocation()
  if (status === 'signed-in' && user && user.role !== 'student') {
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
