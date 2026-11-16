import { useEffect, useState } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react'

/**
 * A page's code is downloaded the first time it is visited. If the network
 * drops at that moment, or a new deploy replaced the old files, the browser
 * throws one of these messages.
 */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch|ChunkLoadError|Loading chunk|Unable to preload CSS/i.test(message)
}

/**
 * Friendly replacement for React Router's developer error screen. Connection
 * problems get a retry that reloads the app (a failed module import is cached
 * by the browser until a full reload) and retries automatically once the
 * device is back online. Anything else gets a generic message, never a stack
 * trace.
 */
export default function RouteError({ compact = false }: { compact?: boolean }) {
  const error = useRouteError()
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const connection = offline || isChunkLoadError(error)
  const notFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    if (import.meta.env.DEV) console.error(error)
  }, [error])

  useEffect(() => {
    if (!connection) return
    const goOffline = () => setOffline(true)
    const backOnline = () => window.location.reload()
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', backOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', backOnline)
    }
  }, [connection])

  const Icon = connection ? WifiOff : AlertTriangle
  const title = notFound ? 'Page not found' : connection ? (offline ? 'You’re offline' : 'Connection problem') : 'Something went wrong'
  const body = notFound
    ? 'The link may be broken, or the page may have moved.'
    : connection
      ? offline
        ? 'Check your internet connection. This page will reload by itself once you are back online.'
        : 'This page could not be loaded. Check your connection and try again.'
      : 'An unexpected problem stopped this page from loading. Try again, and contact Fixth support if it keeps happening.'

  return (
    <div className={compact ? 'route-error compact' : 'route-error'} role="alert">
      <div className="route-error-card">
        <span className="route-error-icon">
          <Icon size={26} aria-hidden />
        </span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="route-error-actions">
          {!notFound && (
            <button type="button" className="route-error-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} aria-hidden />
              Try again
            </button>
          )}
          {/* A plain link: a full page load also clears a cached failed import. */}
          <Link to="/" reloadDocument className="route-error-secondary">
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
