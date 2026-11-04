/**
 * Public placement discovery endpoints. Auth is optional: anonymous calls get
 * public data, a student token adds match, is_saved, has_applied, eligibility,
 * and can_apply.
 */
import { request } from './http'
import type { ApiEligibility, ApiPlacement, ApiPlacementDetail, Paginated } from './types'

export interface StudentPlacement {
  id: string
  slug: string
  title: string
  company: string
  companyId: string
  companySlug: string
  companyLogoUrl: string | null
  companyVerified: boolean
  location: string
  workStyle: string
  duration: string
  discipline: string
  level: number
  stipend: string | null
  stipendAmount: string | null
  currency: string
  description: string
  responsibilities: string
  requirements: string
  status: ApiPlacement['status']
  reports: number
  /** Only populated for a signed-in student with a discipline. */
  match: number | null
  isSaved: boolean
  hasApplied: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentPlacementDetail extends StudentPlacement {
  eligibility: ApiEligibility
  canApply: boolean
}

export type PlacementSort = 'newest' | 'title' | 'match'

export interface PlacementListParams {
  q?: string
  discipline?: string
  location?: string
  duration?: string
  workStyles?: string[]
  /** Requires a student session. */
  saved?: boolean
  sort?: PlacementSort
  page?: number
  pageSize?: number
}

function mapPlacement(api: ApiPlacement): StudentPlacement {
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    company: api.company,
    companyId: api.company_id,
    companySlug: api.company_slug,
    companyLogoUrl: api.company_logo_url,
    companyVerified: api.company_verified,
    location: api.location,
    workStyle: api.work_style,
    duration: api.duration,
    discipline: api.discipline,
    level: api.level,
    stipend: api.stipend,
    stipendAmount: api.stipend_amount,
    currency: api.currency,
    description: api.description,
    responsibilities: api.responsibilities,
    requirements: api.requirements,
    status: api.status,
    reports: api.reports,
    match: api.match,
    isSaved: api.is_saved,
    hasApplied: api.has_applied,
    publishedAt: api.published_at,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

function mapPlacementDetail(api: ApiPlacementDetail): StudentPlacementDetail {
  return { ...mapPlacement(api), eligibility: api.eligibility, canApply: api.can_apply }
}

export async function listPlacements(
  params: PlacementListParams = {},
): Promise<Paginated<StudentPlacement>> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.discipline) query.set('discipline', params.discipline)
  if (params.location) query.set('location', params.location)
  if (params.duration) query.set('duration', params.duration)
  if (params.workStyles?.length) query.set('work_style', params.workStyles.join(','))
  if (params.saved) query.set('saved', 'true')
  if (params.sort) query.set('sort', params.sort)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const suffix = query.size ? `?${query}` : ''
  const page = await request<Paginated<ApiPlacement>>(`/placements/${suffix}`, { auth: 'optional' })
  return { ...page, results: page.results.map(mapPlacement) }
}

export async function getPlacementBySlug(slug: string): Promise<StudentPlacementDetail> {
  const detail = await request<ApiPlacementDetail>(`/placements/${encodeURIComponent(slug)}/`, {
    auth: 'optional',
  })
  return mapPlacementDetail(detail)
}

export async function getPlacementById(id: string): Promise<StudentPlacementDetail> {
  const detail = await request<ApiPlacementDetail>(`/placements/by-id/${encodeURIComponent(id)}/`, {
    auth: 'optional',
  })
  return mapPlacementDetail(detail)
}
