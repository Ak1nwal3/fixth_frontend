import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe, signIn as apiSignIn, signOut as apiSignOut } from '@/services/auth'
import { ApiError } from '@/services/http'
import type { ApiUser } from '@/services/types'
import { AuthContext, type AuthValue } from './useAuth'
import { SESSION_STORAGE_KEY, clearSession, getSession, onSessionExpired, setSession, type AuthRole } from './session'

/**
 * Restores the stored session on mount (validating it against `/me/`, with a
 * token-refresh retry handled by the HTTP layer) and keeps provider state in
 * sync when the HTTP layer reports an unrecoverable 401.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore the stored session synchronously; `/me/` then validates it.
  const [status, setStatus] = useState<AuthValue['status']>(() => (getSession() ? 'signed-in' : 'signed-out'))
  const [user, setUser] = useState<ApiUser | null>(() => getSession()?.user ?? null)

  useEffect(() => {
    const session = getSession()
    if (!session) return
    let live = true
    getMe(session.role)
      .then(me => {
        if (live) setUser(me)
      })
      .catch((error: unknown) => {
        if (!live) return
        // A 401 here means the refresh attempt inside the HTTP layer already
        // failed and the session was cleared. Network/server errors keep the
        // optimistic session; later requests surface them.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearSession()
          setUser(null)
          setStatus('signed-out')
        }
      })
    return () => {
      live = false
    }
  }, [])

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null)
        setStatus('signed-out')
      }),
    [],
  )

  // Keep tabs in sync: signing in, out, or switching accounts in one tab
  // updates every other open tab instead of leaving it on a stale session.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return
      const session = getSession()
      if (session) {
        // Token rotations in another tab also fire this; keep the same user
        // object then so dependent effects do not refetch.
        setUser(current =>
          current && current.id === session.user.id && current.role === session.user.role ? current : session.user,
        )
        setStatus('signed-in')
      } else {
        setUser(null)
        setStatus('signed-out')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const signIn = useCallback(async (role: AuthRole, email: string, password: string) => {
    const response = await apiSignIn(role, email, password)
    setSession({ role, access: response.access, refresh: response.refresh, user: response.user })
    setUser(response.user)
    setStatus('signed-in')
  }, [])

  const establishSession = useCallback(
    (role: AuthRole, tokens: { access: string; refresh: string; user: ApiUser }) => {
      setSession({ role, access: tokens.access, refresh: tokens.refresh, user: tokens.user })
      setUser(tokens.user)
      setStatus('signed-in')
    },
    [],
  )

  const refreshUser = useCallback(async () => {
    const session = getSession()
    if (!session) return
    const me = await getMe(session.role)
    setSession({ ...session, user: me })
    setUser(me)
  }, [])

  const signOut = useCallback(async () => {
    const session = getSession()
    if (session) {
      // Best-effort blacklist; the local session is cleared either way.
      await apiSignOut(session.role, session.refresh).catch(() => {})
    }
    clearSession()
    setUser(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, user, signIn, establishSession, refreshUser, signOut }),
    [status, user, signIn, establishSession, refreshUser, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
