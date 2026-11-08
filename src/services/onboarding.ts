/**
 * Student onboarding endpoints: OTP request/verify aliases and account
 * completion. The verify call does not consume the code — the code is
 * consumed atomically by the completion call.
 */
import { request } from './http'
import type { ApiOrganizationOnboardingResult, ApiStudentProfile, ApiUser } from './types'

export function requestStudentOtp(email: string): Promise<{ detail: string; otp_code?: string }> {
  return request<{ detail: string; otp_code?: string }>('/onboarding/students/request-otp/', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email }),
  })
}

export function verifyStudentOtp(email: string, code: string): Promise<{ detail: string }> {
  return request<{ detail: string }>('/onboarding/students/verify-otp/', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email, code }),
  })
}

export interface StudentOnboardingPayload {
  email: string
  code: string
  password?: string
  first_name: string
  last_name: string
  phone?: string
  location: string
  institution: string
  discipline: string
  level: number
  graduation_year?: number
  student_id?: string
  start_date?: string
  duration?: string
  work_styles?: string[]
  skills?: string[]
  portfolio?: string
  interests?: string
}

export interface StudentOnboardingResult {
  user: ApiUser
  student: ApiStudentProfile
  access: string
  refresh: string
}

export function completeStudentOnboarding(
  payload: StudentOnboardingPayload,
): Promise<StudentOnboardingResult> {
  return request<StudentOnboardingResult>('/onboarding/students/complete/', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify(payload),
  })
}

/* Organization onboarding uses the shared OTP endpoints with track=organization. */

export function requestOrganizationOtp(email: string): Promise<{ detail: string; otp_code?: string }> {
  return request<{ detail: string; otp_code?: string }>('/auth/otp/request/', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email, track: 'organization' }),
  })
}

export interface OrganizationOtpVerification {
  verification_token: string
  is_new_user: boolean
}

export function verifyOrganizationOtp(
  email: string,
  code: string,
): Promise<OrganizationOtpVerification> {
  return request<OrganizationOtpVerification>('/auth/otp/verify/', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ email, track: 'organization', code }),
  })
}

export interface OrganizationOnboardingPayload {
  verificationToken: string
  organizationName: string
  workEmail: string
  password?: string
  industry: string
  country: string
  city: string
  website?: string
  description?: string
  address?: string
  logo?: File | null
}

export function completeOrganizationOnboarding(
  payload: OrganizationOnboardingPayload,
): Promise<ApiOrganizationOnboardingResult> {
  const form = new FormData()
  form.set('verification_token', payload.verificationToken)
  form.set('organization_name', payload.organizationName)
  form.set('work_email', payload.workEmail)
  if (payload.password) form.set('password', payload.password)
  form.set('industry', payload.industry)
  form.set('country', payload.country)
  form.set('city', payload.city)
  if (payload.website) form.set('website', payload.website)
  if (payload.description) form.set('description', payload.description)
  if (payload.address) form.set('address', payload.address)
  if (payload.logo) form.set('logo', payload.logo)

  return request<ApiOrganizationOnboardingResult>('/onboarding/organizations/complete/', {
    method: 'POST',
    auth: 'none',
    body: form,
  })
}
