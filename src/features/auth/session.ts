/**
 * Framework-agnostic auth session storage and token refresh.
 *
 * The API issues JWT access (15 min) and refresh (7 day) tokens in response
 * bodies, so header-based storage in `localStorage` is the only option — there
 * is no cookie flow to prefer. Tokens are never logged or put in URLs.
 */
import { env } from '@/config/env'
import type { ApiUser } from '@/services/types'

const STORAGE_KEY = 'fixth-auth'

export type AuthRole = 'student' | 'organization' | 'admin'

export interface AuthSession {
  role: AuthRole
  access: string
  refresh: string
  user: ApiUser
}

/** Role-specific auth path. Generic `/auth/...` routes are administrator-only. */
export function roleAuthPath(role: AuthRole, action: string): string {
  return role === 'admin' ? `/auth/${action}/` : `/auth/${role}/${action}/`
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<AuthSession>
    if (typeof value?.access !== 'string' || typeof value?.refresh !== 'string' || !value.user) return null
    return value as AuthSession
  } catch {
    return null
  }
}

export function setSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable in private browsing; the in-memory provider
    // state still keeps the session for this tab.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

type SessionExpiredListener = () => void
const listeners = new Set<SessionExpiredListener>()

/** Subscribe to "session is unrecoverably expired" events. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitSessionExpired(): void {
  listeners.forEach(listener => listener())
}

let refreshing: Promise<boolean> | null = null

/**
 * Rotate the stored token pair once. Concurrent calls share a single request
 * so parallel 401s do not race the single-use refresh token.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= performRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function performRefresh(): Promise<boolean> {
  const session = getSession()
  if (!session) return false
  try {
    const response = await fetch(`${env.apiUrl}${roleAuthPath(session.role, 'refresh')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: session.refresh }),
    })
    if (!response.ok) return false
    const tokens = (await response.json()) as { access?: string; refresh?: string }
    if (typeof tokens.access !== 'string') return false
    // Refreshing rotates and blacklists the old refresh token; store the new
    // pair atomically.
    setSession({ ...session, access: tokens.access, refresh: tokens.refresh ?? session.refresh })
    return true
  } catch {
    return false
  }
}
