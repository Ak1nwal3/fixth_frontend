/**
 * Snake_case types mirroring the Fixth API contract (`docs/backend-spec/api-reference.md`).
 * Map to camelCase frontend types at the service boundary.
 */

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiUser {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'student' | 'company' | 'admin'
  account_status: string
  email_verified_at: string | null
  is_active: boolean
  is_staff: boolean
  date_joined: string
  last_login: string | null
}

export interface ApiMe extends ApiUser {
  student_profile_id: string | null
  company_id: string | null
}

export interface ApiDocument {
  id: string
  owner_id: string
  kind: string
  file: string
  original_name: string
  mime_type: string
  size: number
  is_private: boolean
  scan_status: string
  created_at: string
  url: string | null
}

export interface ApiStudentProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  location: string
  institution: string
  discipline: string
  level: number
  graduation_year: number | null
  student_id: string
  start_date: string | null
  duration: string
  work_styles: string[]
  portfolio: string
  interests: string
  skills: string[]
  photo: ApiDocument | null
  resume: ApiDocument | null
  verification_status: string
  risk_level: string
  profile_strength: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiPlacement {
  id: string
  slug: string
  title: string
  company: string
  company_id: string
  company_slug: string
  company_logo_url: string | null
  company_verified: boolean
  location: string
  work_style: string
  duration: string
  discipline: string
  level: number
  stipend: string | null
  stipend_amount: string | null
  currency: string
  description: string
  responsibilities: string
  requirements: string
  status: 'Active' | 'Draft' | 'Closed' | 'Expired' | 'Unpublished'
  reports: number
  match: number | null
  is_saved: boolean
  has_applied: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiEligibility {
  eligible: boolean
  reason: string
  required_level: number
  required_discipline: string | null
}

export interface ApiPlacementDetail extends ApiPlacement {
  eligibility: ApiEligibility
  can_apply: boolean
}

export interface ApiTerm {
  id: string
  name: string
  slug: string
}

export interface ApiSignInResponse {
  access: string
  refresh: string
  user: ApiUser
}

/** Extract a human-readable message from a DRF error body. */
export function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string' && detail) return detail
    for (const value of Object.values(body)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
      if (typeof value === 'string' && value) return value
    }
  }
  return fallback
}
