/**
 * Saved placement endpoints (`POST/DELETE /placements/{id}/save/`,
 * `GET /students/me/saved-placements/`). Requires a verified student session;
 * the student is derived from the token, never the request body.
 */
import { request } from './http'
import { mapPlacement, type StudentPlacement } from './placements'
import type { ApiSavedPlacement, Paginated } from './types'

export interface StudentSavedPlacement {
  id: string
  placement: StudentPlacement
  savedAt: string
}

function mapSaved(api: ApiSavedPlacement): StudentSavedPlacement {
  return {
    id: api.id,
    placement: mapPlacement(api.placement),
    savedAt: api.created_at,
  }
}

/** Save a currently discoverable placement. 409 if already saved. */
export async function savePlacement(placementId: string): Promise<StudentSavedPlacement> {
  const saved = await request<ApiSavedPlacement>(
    `/placements/${encodeURIComponent(placementId)}/save/`,
    { method: 'POST' },
  )
  return mapSaved(saved)
}

/** 204, or 404 when the placement/save record does not exist for this student. */
export async function unsavePlacement(placementId: string): Promise<void> {
  await request<void>(`/placements/${encodeURIComponent(placementId)}/save/`, {
    method: 'DELETE',
  })
}

/** Newest save first; a saved placement may remain after it is closed. */
export async function listSavedPlacements(
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<StudentSavedPlacement>> {
  const query = new URLSearchParams()
  if (params.page && params.page > 1) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const suffix = query.size ? `?${query}` : ''
  const page = await request<Paginated<ApiSavedPlacement>>(
    `/students/me/saved-placements/${suffix}`,
  )
  return { ...page, results: page.results.map(mapSaved) }
}
