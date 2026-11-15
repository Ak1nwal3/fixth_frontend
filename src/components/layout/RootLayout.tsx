import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'

/** Shown while a code-split page downloads. */
function PageFallback() {
  return (
    <main role="status" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      Loading…
    </main>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  )
}
