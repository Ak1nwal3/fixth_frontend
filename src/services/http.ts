/**
 * Thin `fetch` wrapper for the fixth API.
 *
 * - Attaches `Authorization: Bearer <access>` when a session exists.
 * - On `401`, rotates the token pair once via the role refresh endpoint and
 *   retries the request a single time. If refresh fails the session is
 *   cleared; optional-auth endpoints are then retried anonymously.
 * - Parses error bodies into `ApiError.body` (`{detail}` or field errors).
 * - Sends JSON by default; pass a `FormData` body for multipart requests
 *   (the browser sets the multipart boundary — do not set it manually).
 */
import { env } from '@/config/env'
import { clearSession, emitSessionExpired, getSession, refreshSession } from '@/features/auth/session'

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestOptions extends RequestInit {
  /**
   * 'required' (default): the call needs an authenticated session; a failed
   * token refresh surfaces the 401. 'optional': public endpoint that returns
   * extra fields for signed-in users; falls back to an anonymous retry.
   * 'none': public auth endpoints — never attach tokens or refresh on 401.
   */
  auth?: 'required' | 'optional' | 'none'
}

async function send(path: string, init: RequestOptions, access: string | null): Promise<Response> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (access) headers.set('Authorization', `Bearer ${access}`)
  const { auth: _auth, ...rest } = init
  return fetch(`${env.apiUrl}${path}`, { ...rest, headers })
}

export async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const session = init.auth === 'none' ? null : getSession()
  let response = await send(path, init, session?.access ?? null)

  if (response.status === 401 && session) {
    if (await refreshSession()) {
      response = await send(path, init, getSession()?.access ?? null)
    } else {
      clearSession()
      emitSessionExpired()
      if (init.auth === 'optional') {
        response = await send(path, init, null)
      }
    }
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    const detail =
      body && typeof body === 'object' && typeof (body as { detail?: unknown }).detail === 'string'
        ? ((body as { detail: string }).detail)
        : response.statusText
    throw new ApiError(detail, response.status, body)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
