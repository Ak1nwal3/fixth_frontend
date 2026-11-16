/**
 * Framework-agnostic auth session storage and token refresh.
 *
 * The API issues JWT access (15 min) and refresh (7 day) tokens in response
 * bodies, so header-based storage in `localStorage` is the only option — there
 * is no cookie flow to prefer. Tokens are never logged or put in URLs.
 */
import { env } from '@/config/env'
import type { ApiUser } from '@/services/types'
import { clearApiCache } from '@/services/cache'

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
  // A different account must never see the previous account's cached data.
  const previous = getSession()
  if (!previous || previous.user.id !== session.user.id || previous.role !== session.role) clearApiCache()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable in private browsing; the in-memory provider
    // state still keeps the session for this tab.
  }
}

export function clearSession(): void {
  clearApiCache()
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

/** Same key in every tab, so `storage` events let tabs follow each other. */
export const SESSION_STORAGE_KEY = STORAGE_KEY

let refreshing: Promise<boolean> | null = null

/**
 * Rotate the stored token pair once. Concurrent calls in this tab share a
 * single request, and a Web Lock serializes refreshes across tabs, so parallel
 * 401s never race the single-use refresh token.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= performRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function performRefresh(): Promise<boolean> {
  const seen = getSession()
  if (!seen) return false
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (locks?.request) {
    return locks.request('fixth-auth-refresh', () => rotate(seen.refresh))
  }
  return rotate(seen.refresh)
}

/** True when another tab has already stored a newer token pair. */
function rotatedElsewhere(staleRefresh: string): boolean {
  const current = getSession()
  return !!current && current.refresh !== staleRefresh
}

async function rotate(staleRefresh: string): Promise<boolean> {
  const session = getSession()
  if (!session) return false
  // Another tab refreshed while this one waited for the lock: reuse its tokens.
  if (session.refresh !== staleRefresh) return true
  try {
    const response = await fetch(`${env.apiUrl}${roleAuthPath(session.role, 'refresh')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: session.refresh }),
      signal: AbortSignal.timeout(60_000),
    })
    // A rejected token may have been rotated by a tab without Web Locks.
    if (!response.ok) return rotatedElsewhere(staleRefresh)
    const tokens = (await response.json()) as { access?: string; refresh?: string }
    if (typeof tokens.access !== 'string') return false
    // Refreshing rotates and blacklists the old refresh token; store the new
    // pair atomically.
    setSession({ ...session, access: tokens.access, refresh: tokens.refresh ?? session.refresh })
    return true
  } catch (error) {
    if (rotatedElsewhere(staleRefresh)) return true
    // Network failure or timeout: the session may still be valid, so surface a
    // connection error to the caller instead of signing the user out.
    throw error
  }
}
