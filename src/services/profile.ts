/**
 * Student profile endpoints (`/students/me/`). Requires a verified student
 * session. Email, photo, and resume are read-only on this resource.
 */
import { request } from './http'
import type { ApiDocument, ApiStudentProfile } from './types'

export interface StudentProfileData {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  location: string
  institution: string
  discipline: string
  level: number
  graduationYear: number | null
  studentId: string
  startDate: string | null
  duration: string
  workStyles: string[]
  portfolio: string
  interests: string
  skills: string[]
  photo: ApiDocument | null
  resume: ApiDocument | null
  verificationStatus: string
  riskLevel: string
  profileStrength: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentProfilePatch {
  firstName?: string
  lastName?: string
  phone?: string
  location?: string
  institution?: string
  discipline?: string
  level?: number
  graduationYear?: number | null
  studentId?: string
  startDate?: string | null
  duration?: string
  workStyles?: string[]
  portfolio?: string
  interests?: string
  /** Replaces the full skill set when provided. */
  skills?: string[]
}

function mapProfile(api: ApiStudentProfile): StudentProfileData {
  return {
    id: api.id,
    userId: api.user_id,
    email: api.email,
    firstName: api.first_name,
    lastName: api.last_name,
    phone: api.phone,
    location: api.location,
    institution: api.institution,
    discipline: api.discipline,
    level: api.level,
    graduationYear: api.graduation_year,
    studentId: api.student_id,
    startDate: api.start_date,
    duration: api.duration,
    workStyles: api.work_styles,
    portfolio: api.portfolio,
    interests: api.interests,
    skills: api.skills,
    photo: api.photo,
    resume: api.resume,
    verificationStatus: api.verification_status,
    riskLevel: api.risk_level,
    profileStrength: api.profile_strength,
    deletedAt: api.deleted_at,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

function mapPatch(patch: StudentProfilePatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.firstName !== undefined) body.first_name = patch.firstName
  if (patch.lastName !== undefined) body.last_name = patch.lastName
  if (patch.phone !== undefined) body.phone = patch.phone
  if (patch.location !== undefined) body.location = patch.location
  if (patch.institution !== undefined) body.institution = patch.institution
  if (patch.discipline !== undefined) body.discipline = patch.discipline
  if (patch.level !== undefined) body.level = patch.level
  if (patch.graduationYear !== undefined) body.graduation_year = patch.graduationYear
  if (patch.studentId !== undefined) body.student_id = patch.studentId
  if (patch.startDate !== undefined) body.start_date = patch.startDate
  if (patch.duration !== undefined) body.duration = patch.duration
  if (patch.workStyles !== undefined) body.work_styles = patch.workStyles
  if (patch.portfolio !== undefined) body.portfolio = patch.portfolio
  if (patch.interests !== undefined) body.interests = patch.interests
  if (patch.skills !== undefined) body.skills = patch.skills
  return body
}

export async function getStudentProfile(): Promise<StudentProfileData> {
  const profile = await request<ApiStudentProfile>('/students/me/')
  return mapProfile(profile)
}

/** Exposed for media endpoints that return the full updated profile. */
export function mapStudentProfile(api: ApiStudentProfile): StudentProfileData {
  return mapProfile(api)
}

export async function updateStudentProfile(patch: StudentProfilePatch): Promise<StudentProfileData> {
  const profile = await request<ApiStudentProfile>('/students/me/', {
    method: 'PATCH',
    body: JSON.stringify(mapPatch(patch)),
  })
  return mapProfile(profile)
}
