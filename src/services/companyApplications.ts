/**
 * Company application management. Requires an active, verified organization
 * session. The backend scopes every response to the caller's own placements.
 */
import { request } from './http'
import { mapPlacement, type StudentPlacement } from './placements'
import type {
  ApiApplication,
  ApiApplicationEvent,
  ApiApplicationStatus,
  ApiApplicationStudent,
  ApiApplicantContact,
  ApiDocument,
  ApiPlacement,
  Paginated,
} from './types'

export interface CompanyApplicationStudent {
  id: string
  userId: string
  firstName: string
  lastName: string
  fullName: string
  institution: string
  discipline: string
  level: number
  location: string
  skills: string[]
  photoUrl: string | null
  verificationStatus: string
  riskLevel: string
}

export interface CompanyApplicationEvent {
  id: string
  fromStatus: string | null
  toStatus: string
  actorEmail: string | null
  reason: string
  createdAt: string
}

export interface CompanyApplication {
  id: string
  placement: StudentPlacement
  placementId: string
  student: CompanyApplicationStudent
  studentId: string
  resume: ApiDocument | null
  status: ApiApplicationStatus
  appliedAt: string
  statusChangedAt: string | null
  decidedByEmail: string | null
  rejectionReason: string
  coverNote: string
  events: CompanyApplicationEvent[]
  updatedAt: string
}

export interface ApplicantContact {
  email: string
  phone: string
}

export interface CompanyApplicationListParams {
  placement?: string
  status?: string
  q?: string
  discipline?: string
  sort?: 'newest' | 'oldest' | 'name'
  page?: number
  pageSize?: number
}

function mapStudent(api: ApiApplicationStudent): CompanyApplicationStudent {
  return {
    id: api.id,
    userId: api.user_id,
    firstName: api.first_name,
    lastName: api.last_name,
    fullName: api.full_name || `${api.first_name} ${api.last_name}`.trim(),
    institution: api.institution,
    discipline: api.discipline,
    level: api.level,
    location: api.location,
    skills: api.skills,
    photoUrl: api.photo_url,
    verificationStatus: api.verification_status,
    riskLevel: api.risk_level,
  }
}

function mapEvent(api: ApiApplicationEvent): CompanyApplicationEvent {
  return {
    id: api.id,
    fromStatus: api.from_status,
    toStatus: api.to_status,
    actorEmail: api.actor_email,
    reason: api.reason,
    createdAt: api.created_at,
  }
}

export function mapCompanyApplication(api: ApiApplication): CompanyApplication {
  return {
    id: api.id,
    placement: mapPlacement(api.placement as ApiPlacement),
    placementId: api.placement_id,
    student: mapStudent(api.student),
    studentId: api.student_id,
    resume: api.resume,
    status: api.status,
    appliedAt: api.applied_at,
    statusChangedAt: api.status_changed_at,
    decidedByEmail: api.decided_by_email,
    rejectionReason: api.rejection_reason,
    coverNote: api.cover_note,
    events: api.events.map(mapEvent),
    updatedAt: api.updated_at,
  }
}

function buildApplicationQuery(params: CompanyApplicationListParams): string {
  const query = new URLSearchParams()
  if (params.placement) query.set('placement', params.placement)
  if (params.status && params.status !== 'All') query.set('status', params.status)
  if (params.q) query.set('q', params.q)
  if (params.discipline && params.discipline !== 'All disciplines') {
    query.set('discipline', params.discipline)
  }
  if (params.sort) query.set('sort', params.sort)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  return query.size ? `?${query}` : ''
}

export async function listCompanyApplications(
  params: CompanyApplicationListParams = {},
): Promise<Paginated<CompanyApplication>> {
  const page = await request<Paginated<ApiApplication>>(
    `/company/applications/${buildApplicationQuery(params)}`,
  )
  return { ...page, results: page.results.map(mapCompanyApplication) }
}

export async function listPlacementApplicants(
  placementId: string,
  params: CompanyApplicationListParams = {},
): Promise<Paginated<CompanyApplication>> {
  const page = await request<Paginated<ApiApplication>>(
    `/company/placements/${encodeURIComponent(placementId)}/applicants/${buildApplicationQuery(params)}`,
  )
  return { ...page, results: page.results.map(mapCompanyApplication) }
}

export async function getCompanyApplication(id: string): Promise<CompanyApplication> {
  const application = await request<ApiApplication>(
    `/company/applications/${encodeURIComponent(id)}/`,
  )
  return mapCompanyApplication(application)
}

/** Gated applicant contact details. Only Shortlisted/Accepted applications
 *  return them; other statuses get 403. */
export async function getApplicantContact(id: string): Promise<ApplicantContact> {
  const contact = await request<ApiApplicantContact>(
    `/company/applications/${encodeURIComponent(id)}/contact/`,
  )
  return { email: contact.email, phone: contact.phone }
}

export async function updateCompanyApplicationStatus(
  id: string,
  status: Exclude<ApiApplicationStatus, 'Submitted' | 'Withdrawn'>,
  reason?: string,
): Promise<CompanyApplication> {
  const application = await request<ApiApplication>(
    `/company/applications/${encodeURIComponent(id)}/`,
    {
      method: 'PATCH',
      body: JSON.stringify(reason ? { status, reason } : { status }),
    },
  )
  return mapCompanyApplication(application)
}
