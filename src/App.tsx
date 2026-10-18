import { RouterProvider } from 'react-router'

import { router } from '@/routes'

/**
 * Root application component.
 *
 * Global providers (theme, data fetching, auth, ...) wrap `RouterProvider` here
 * so they stay above the router and survive route changes.
 */
export default function App() {
  return <RouterProvider router={router} />
}
