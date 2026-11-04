import { createContext, useContext } from 'react'
import type { ApiUser } from '@/services/types'
import type { AuthRole } from './session'

export interface AuthValue {
  status: 'loading' | 'signed-in' | 'signed-out'
  user: ApiUser | null
  /** Signs in and stores the session. Throws ApiError on failure. */
  signIn: (role: AuthRole, email: string, password: string) => Promise<void>
  /** Stores a session from a token-issuing flow (e.g. onboarding completion). */
  establishSession: (role: AuthRole, tokens: { access: string; refresh: string; user: ApiUser }) => void
  /** Blacklists the refresh token server-side and clears the local session. */
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is required')
  return value
}
