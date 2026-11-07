/**
 * Student media, verification, and account-deletion endpoints. Requires a
 * verified student session. See `docs/backend-spec/api-reference.md` §6.5–6.6
 * and §11.
 */
import { request, ApiError } from './http'
import type { ApiDocument, ApiStudentProfile, ApiVerificationRequest } from './types'
import { mapStudentProfile, type StudentProfileData } from './profile'

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024
export const MAX_RESUME_BYTES = 5 * 1024 * 1024

/** POST multipart `file`. 200 → full updated `StudentProfile`. */
export async function uploadStudentPhoto(file: File): Promise<StudentProfileData> {
  const body = new FormData()
  body.append('file', file)
  const profile = await request<ApiStudentProfile>('/students/me/photo/', {
    method: 'POST',
    body,
  })
  return mapStudentProfile(profile)
}

/** DELETE → 204. An already-empty photo also succeeds. */
export async function deleteStudentPhoto(): Promise<void> {
  await request<void>('/students/me/photo/', { method: 'DELETE' })
}

/** GET → 200 `Document`, or `null` when there is no active resume (404). */
export async function getActiveStudentResume(): Promise<ApiDocument | null> {
  try {
    return await request<ApiDocument>('/students/me/resume/')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** POST multipart `file`. 200 → the new `Document` (old one is replaced). */
export async function uploadStudentResume(file: File): Promise<ApiDocument> {
  const body = new FormData()
  body.append('file', file)
  return request<ApiDocument>('/students/me/resume/', { method: 'POST', body })
}

/** DELETE → 204. An already-absent resume also succeeds. */
export async function deleteStudentResume(): Promise<void> {
  await request<void>('/students/me/resume/', { method: 'DELETE' })
}

export interface StudentVerification {
  id: string
  kind: string
  subjectId: string
  subjectLabel: string
  status: string
  riskLevel: string
  submittedAt: string | null
  decisionReason: string
  updatedAt: string
}

/**
 * POST /students/me/verification/ — no request body. The review uses the
 * student's existing profile; students cannot set status or decisions.
 */
export async function submitStudentVerification(): Promise<StudentVerification> {
  const api = await request<ApiVerificationRequest>('/students/me/verification/', {
    method: 'POST',
  })
  return {
    id: api.id,
    kind: api.kind,
    subjectId: api.subject_id,
    subjectLabel: api.subject_label,
    status: api.status,
    riskLevel: api.risk_level,
    submittedAt: api.submitted_at,
    decisionReason: api.decision_reason,
    updatedAt: api.updated_at,
  }
}

/**
 * DELETE /students/me/ with `confirm: true`. Soft-deletes and anonymizes the
 * account, blacklists refresh tokens, and returns 204.
 */
export async function deleteStudentAccount(): Promise<void> {
  await request<void>('/students/me/', {
    method: 'DELETE',
    body: JSON.stringify({ confirm: true }),
  })
}
