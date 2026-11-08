/**
 * Student-side application endpoints (`/applications/`). Requires a verified
 * student session. See `docs/backend-spec/api-reference.md` §10.
 */
import { request } from './http'
import { mapPlacement, type StudentPlacement } from './placements'
import type {
  ApiApplication,
  ApiApplicationEvent,
  ApiApplicationStatus,
  ApiApplicationSummary,
  ApiDocument,
  Paginated,
} from './types'

export interface StudentApplicationEvent {
  id: string
  fromStatus: string | null
  toStatus: string
  actorEmail: string | null
  reason: string
  createdAt: string
}

export interface StudentApplication {
  id: string
  placement: StudentPlacement
  placementId: string
  studentId: string
  resume: ApiDocument | null
  status: ApiApplicationStatus
  appliedAt: string
  statusChangedAt: string | null
  decidedByEmail: string | null
  rejectionReason: string
  coverNote: string
  events: StudentApplicationEvent[]
  updatedAt: string
}

export interface StudentApplicationSummary {
  total: number
  pending: number
  underReview: number
  shortlisted: number
  accepted: number
  rejected: number
  withdrawn: number
}

export interface StudentApplicationListParams {
  status?: string
  page?: number
  pageSize?: number
}

function mapEvent(api: ApiApplicationEvent): StudentApplicationEvent {
  return {
    id: api.id,
    fromStatus: api.from_status,
    toStatus: api.to_status,
    actorEmail: api.actor_email,
    reason: api.reason,
    createdAt: api.created_at,
  }
}

export function mapStudentApplication(api: ApiApplication): StudentApplication {
  return {
    id: api.id,
    placement: mapPlacement(api.placement),
    placementId: api.placement_id,
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

function mapSummary(api: ApiApplicationSummary): StudentApplicationSummary {
  return {
    total: api.total,
    pending: api.pending,
    underReview: api.under_review,
    shortlisted: api.shortlisted,
    accepted: api.accepted,
    rejected: api.rejected,
    withdrawn: api.withdrawn,
  }
}

/** Submit an application. `resumeId` is optional — the backend falls back to
 *  the student's active resume, so a local resume file is never required. */
export async function submitStudentApplication(input: {
  placementId: string
  resumeId?: string | null
}): Promise<StudentApplication> {
  const body: Record<string, unknown> = { placement_id: input.placementId }
  if (input.resumeId) body.resume_id = input.resumeId
  const application = await request<ApiApplication>('/applications/', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return mapStudentApplication(application)
}

export async function listStudentApplications(
  params: StudentApplicationListParams = {},
): Promise<Paginated<StudentApplication>> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'All') query.set('status', params.status)
  if (params.page && params.page > 1) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const suffix = query.size ? `?${query}` : ''
  const page = await request<Paginated<ApiApplication>>(`/applications/${suffix}`)
  return { ...page, results: page.results.map(mapStudentApplication) }
}

export async function getStudentApplicationSummary(): Promise<StudentApplicationSummary> {
  const summary = await request<ApiApplicationSummary>('/applications/summary/')
  return mapSummary(summary)
}

export async function getStudentApplication(id: string): Promise<StudentApplication> {
  const application = await request<ApiApplication>(
    `/applications/${encodeURIComponent(id)}/`,
  )
  return mapStudentApplication(application)
}

/** Timeline events, chronological by created_at. Not paginated. */
export async function listStudentApplicationEvents(
  id: string,
): Promise<StudentApplicationEvent[]> {
  const events = await request<ApiApplicationEvent[]>(
    `/applications/${encodeURIComponent(id)}/events/`,
  )
  return events.map(mapEvent)
}

/** Withdraw from Submitted/Viewed/Shortlisted applications; no request body. */
export async function withdrawStudentApplication(
  id: string,
): Promise<StudentApplication> {
  const application = await request<ApiApplication>(
    `/applications/${encodeURIComponent(id)}/withdraw/`,
    { method: 'POST' },
  )
  return mapStudentApplication(application)
}
