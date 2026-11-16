import type { ApiUser } from '@/services/types'

/** Where each signed-in account type lands: its workspace's first page. */
export function roleHome(role: ApiUser['role'] | undefined | null): string | null {
  if (role === 'student') return '/student/discover'
  if (role === 'company') return '/company/placements'
  return null
}

/** How an account type is named to people. */
export function roleLabel(role: ApiUser['role'] | undefined | null): string {
  if (role === 'student') return 'student'
  if (role === 'company') return 'organization'
  return 'administrator'
}
