/**
 * Public canonical reference data (skills and disciplines typeahead).
 * Returns plain arrays (max 50), not paginated.
 */
import { request } from './http'
import type { ApiTerm } from './types'

export function listSkills(search = ''): Promise<ApiTerm[]> {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<ApiTerm[]>(`/skills/${suffix}`, { auth: 'optional' })
}

export function listDisciplines(search = ''): Promise<ApiTerm[]> {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<ApiTerm[]>(`/disciplines/${suffix}`, { auth: 'optional' })
}
