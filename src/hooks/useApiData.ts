import { useEffect, useState } from 'react'
import { ApiError } from '@/services/http'

export interface ApiDataState<T> {
  status: 'loading' | 'success' | 'error'
  data?: T
  error?: ApiError
}

/**
 * Minimal data-fetching hook with loading/success/error states. Re-runs when
 * `deps` change; ignores responses that arrive after unmount or a re-run.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    fetcher()
      .then(data => {
        if (live) setState({ status: 'success', data })
      })
      .catch(error => {
        if (live) {
          setState({
            status: 'error',
            error: error instanceof ApiError ? error : new ApiError('Something went wrong.', 0),
          })
        }
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
