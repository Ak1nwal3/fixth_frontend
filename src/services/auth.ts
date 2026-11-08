/**
 * Role-scoped authentication endpoints. Request/response shapes are identical
 * across roles; only the path namespace changes (generic routes are admin-only).
 */
import { request } from './http'
import { roleAuthPath, type AuthRole } from '@/features/auth/session'
import type { ApiMe, ApiSignInResponse } from './types'

export function signIn(role: AuthRole, email: string, password: string): Promise<ApiSignInResponse> {
  return request<ApiSignInResponse>(roleAuthPath(role, 'sign-in'), {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email, password }),
  })
}

/** Blacklists the refresh token. No Authorization header is required. */
export function signOut(role: AuthRole, refresh: string): Promise<void> {
  return request<void>(roleAuthPath(role, 'sign-out'), {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ refresh }),
  })
}

/** Always 202 with a generic detail message (no account enumeration). */
export function requestPasswordReset(role: AuthRole, email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(roleAuthPath(role, 'password-reset'), {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email }),
  })
}

export function confirmPasswordReset(
  role: AuthRole,
  payload: { uid: string; token: string; new_password: string },
): Promise<void> {
  return request<void>(roleAuthPath(role, 'password-reset/confirm'), {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(payload),
  })
}

export function getMe(role: AuthRole): Promise<ApiMe> {
  return request<ApiMe>(roleAuthPath(role, 'me'))
}

export interface UpdateMePayload {
  first_name?: string
  last_name?: string
  current_password?: string
  new_password?: string
}

/** Update the signed-in account's name or password. */
export function updateMe(role: AuthRole, payload: UpdateMePayload): Promise<ApiMe> {
  return request<ApiMe>(roleAuthPath(role, 'me'), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
