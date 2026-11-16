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
import { cached, clearApiCache } from './cache'

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
  /** GET only: skip the short-lived response cache and fetch fresh data. */
  fresh?: boolean
}

/**
 * Requests that never answer (e.g. a cold-starting backend) must not leave
 * spinners running forever. Render cold starts can take ~50 s, so the limit is
 * generous; uploads get longer for slow connections.
 */
export const REQUEST_TIMEOUT_MS = 60_000
const UPLOAD_TIMEOUT_MS = 180_000

async function send(path: string, init: RequestOptions, access: string | null): Promise<Response> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (access) headers.set('Authorization', `Bearer ${access}`)
  const { auth: _auth, fresh: _fresh, ...rest } = init
  const timeout = init.body instanceof FormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  return fetch(`${env.apiUrl}${path}`, { ...rest, headers, signal: rest.signal ?? AbortSignal.timeout(timeout) })
}

/** Signs the tab out when the API rejects the session for good. */
function expireSession() {
  clearSession()
  emitSessionExpired()
}

/**
 * Calls the API. GET responses are briefly cached per account (see cache.ts)
 * so moving between pages does not refetch everything; any write clears the
 * cache so the user's own changes always show immediately.
 */
export async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  if (method !== 'GET') {
    try {
      return await perform<T>(path, init)
    } finally {
      clearApiCache()
    }
  }
  const session = init.auth === 'none' ? null : getSession()
  const identity =
    init.auth === 'optional' && session?.role !== 'student' ? 'anon' : session ? `${session.role}:${session.user.id}` : 'anon'
  const key = `${identity}|${path}`
  if (init.fresh) clearApiCache()
  return cached(key, () => perform<T>(path, init))
}

async function perform<T>(path: string, init: RequestOptions): Promise<T> {
  let session = init.auth === 'none' ? null : getSession()
  // Optional-auth endpoints are student discovery: their extra fields
  // (match, eligibility, saved) only exist for students, so other account
  // types browse them anonymously.
  if (init.auth === 'optional' && session?.role !== 'student') session = null
  let response = await send(path, init, session?.access ?? null)

  if (response.status === 401 && session) {
    if (await refreshSession()) {
      response = await send(path, init, getSession()?.access ?? null)
      // Still rejected with fresh tokens: the session was revoked (for
      // example by a password change on another device). Sign out rather than
      // leave every page failing until the user signs out by hand.
      if (response.status === 401) {
        expireSession()
        if (init.auth === 'optional') response = await send(path, init, null)
      }
    } else {
      expireSession()
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

/**
 * Fetch a binary resource (e.g. an authorized document download at
 * `/documents/{id}/download/`) with the same session handling as `request()`.
 */
export async function requestBlob(path: string): Promise<Blob> {
  const session = getSession()
  let response = await send(path, {}, session?.access ?? null)

  if (response.status === 401 && session) {
    if (await refreshSession()) {
      response = await send(path, {}, getSession()?.access ?? null)
      if (response.status === 401) expireSession()
    } else {
      expireSession()
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

  return response.blob()
}
