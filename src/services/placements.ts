/**
 * Public placement discovery endpoints. Auth is optional: anonymous calls get
 * public data, a student token adds match, is_saved, has_applied, eligibility,
 * and can_apply.
 */
import { request } from './http'
import type { ApiEligibility, ApiPlacement, ApiPlacementDetail, ApiPlacementFacets, Paginated } from './types'

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
  /** Internship, SIWES, Industrial Training, or null for legacy listings. */
  placementType: string | null
  expiresAt: string | null
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

/** Company-facing write payload (camelCase; mapped to snake_case below). */
export interface CompanyPlacementInput {
  title: string
  location: string
  workStyle: string
  duration: string
  discipline: string
  level: number
  stipendAmount: string
  currency: string
  description: string
  responsibilities: string
  requirements: string
  status?: 'Draft' | 'Active' | 'Closed'
}

export type CompanyPlacementStatus = ApiPlacement['status']

export interface CompanyPlacementListParams {
  status?: string
  q?: string
  sort?: 'newest' | 'oldest' | 'title'
  page?: number
  pageSize?: number
}

function mapCompanyPlacementPatch(input: Partial<CompanyPlacementInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (input.title !== undefined) body.title = input.title
  if (input.location !== undefined) body.location = input.location
  if (input.workStyle !== undefined) body.work_style = input.workStyle
  if (input.duration !== undefined) body.duration = input.duration
  if (input.discipline !== undefined) body.discipline = input.discipline
  if (input.level !== undefined) body.level = input.level
  if (input.stipendAmount !== undefined) {
    body.stipend_amount = input.stipendAmount === '' ? null : input.stipendAmount
  }
  if (input.currency !== undefined) body.currency = input.currency
  if (input.description !== undefined) body.description = input.description
  if (input.responsibilities !== undefined) body.responsibilities = input.responsibilities
  if (input.requirements !== undefined) body.requirements = input.requirements
  if (input.status !== undefined) body.status = input.status
  return body
}

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

export function mapPlacement(api: ApiPlacement): StudentPlacement {
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
    placementType: api.type,
    expiresAt: api.expires_at,
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

export interface PlacementFacets {
  disciplines: string[]
  locations: string[]
  durations: string[]
  workStyles: string[]
}

/** Dynamic discovery filter values, derived from publicly active placements. */
export async function getPlacementFacets(): Promise<PlacementFacets> {
  const facets = await request<ApiPlacementFacets>('/placements/facets/', { auth: 'optional' })
  return {
    disciplines: facets.disciplines,
    locations: facets.locations,
    durations: facets.durations,
    workStyles: facets.work_styles,
  }
}

/** Company-side listing endpoints. Require an organization session. */
export async function listCompanyPlacements(
  params: CompanyPlacementListParams = {},
): Promise<Paginated<StudentPlacement>> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'All') query.set('status', params.status)
  if (params.q) query.set('q', params.q)
  if (params.sort) query.set('sort', params.sort)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const suffix = query.size ? `?${query}` : ''
  const page = await request<Paginated<ApiPlacement>>(`/company/placements/${suffix}`)
  return { ...page, results: page.results.map(mapPlacement) }
}

export async function getCompanyPlacement(id: string): Promise<StudentPlacement> {
  const placement = await request<ApiPlacement>(`/company/placements/${encodeURIComponent(id)}/`)
  return mapPlacement(placement)
}

export async function createCompanyPlacement(
  input: CompanyPlacementInput,
): Promise<StudentPlacement> {
  const placement = await request<ApiPlacement>('/company/placements/', {
    method: 'POST',
    body: JSON.stringify(mapCompanyPlacementPatch(input)),
  })
  return mapPlacement(placement)
}

export async function updateCompanyPlacement(
  id: string,
  input: Partial<CompanyPlacementInput>,
): Promise<StudentPlacement> {
  const placement = await request<ApiPlacement>(`/company/placements/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify(mapCompanyPlacementPatch(input)),
  })
  return mapPlacement(placement)
}

export async function publishCompanyPlacement(id: string): Promise<StudentPlacement> {
  const placement = await request<ApiPlacement>(
    `/company/placements/${encodeURIComponent(id)}/publish/`,
    { method: 'POST' },
  )
  return mapPlacement(placement)
}
