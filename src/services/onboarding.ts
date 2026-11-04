/**
 * Student onboarding endpoints: OTP request/verify aliases and account
 * completion. The verify call does not consume the code — the code is
 * consumed atomically by the completion call.
 */
import { request } from './http'
import type { ApiStudentProfile, ApiUser } from './types'

export function requestStudentOtp(email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>('/onboarding/students/request-otp/', {
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
