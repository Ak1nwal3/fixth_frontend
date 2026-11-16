/**
 * Short-lived in-memory cache for GET responses.
 *
 * Moving between pages used to refetch everything (profile, placements,
 * applicants) every time. Responses are now reused for a short window, and
 * identical requests that are already in flight share one network call.
 *
 * Correctness rules:
 * - Entries are keyed by account, so one account never sees another's data.
 * - Any write (POST/PATCH/PUT/DELETE) clears the whole cache, so data always
 *   reflects the user's own changes immediately.
 * - Signing in, out, or switching accounts clears it too (session.ts).
 * - Entries expire after CACHE_TTL_MS, so other people's changes (new
 *   applicants, edited listings) still show up within that window.
 */
export const CACHE_TTL_MS = 60_000
/** Upper bound so a long session does not grow memory without limit. */
const MAX_ENTRIES = 200

interface Entry {
  at: number
  value: unknown
}

const entries = new Map<string, Entry>()
const inflight = new Map<string, Promise<unknown>>()
/** Bumped on every clear so a response that started earlier is not stored. */
let generation = 0

export function readCache<T>(key: string): T | undefined {
  const entry = entries.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    entries.delete(key)
    return undefined
  }
  return entry.value as T
}

/**
 * Returns the cached value, joins an identical in-flight request, or runs
 * `load` and caches its result. Failures are never cached.
 */
export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = readCache<T>(key)
  if (hit !== undefined) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>
  const started = generation
  const promise = load()
    .then(value => {
      if (started === generation) {
        if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value!)
        entries.set(key, { at: Date.now(), value })
      }
      return value
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key)
    })
  inflight.set(key, promise)
  return promise
}

export function clearApiCache(): void {
  generation += 1
  entries.clear()
  inflight.clear()
}
