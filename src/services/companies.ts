/**
 * Company profile, metrics, and public-company endpoints. Company management
 * endpoints require an active organization session; the public company
 * endpoint (`GET /companies/{slug}/`) needs no authentication.
 */
import { request } from './http'
import type {
  ApiCompany,
  ApiCompanyMetrics,
  ApiDocument,
  ApiPublicCompany,
} from './types'

export interface CompanyProfile {
  id: string
  name: string
  slug: string
  website: string
  industry: string
  description: string
  country: string
  city: string
  address: string
  logo: ApiDocument | null
  registrationNumber: string
  primaryContactName: string
  primaryContactTitle: string
  verificationStatus: string
}

export interface CompanySummary {
  /** Excludes active listings past their expiry time. */
  activePlacements: number
  applicants: number
  shortlisted: number
  hired: number
}

export interface PublicCompany {
  id: string
  name: string
  slug: string
  website: string
  industry: string
  description: string
  country: string
  city: string
  address: string
  logoUrl: string | null
  verificationStatus: string
}

export interface CompanyProfilePatch {
  name?: string
  website?: string
  industry?: string
  description?: string
  country?: string
  city?: string
  address?: string
  registrationNumber?: string
  primaryContactName?: string
  primaryContactTitle?: string
}

function mapCompany(api: ApiCompany): CompanyProfile {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    website: api.website,
    industry: api.industry,
    description: api.description,
    country: api.country,
    city: api.city,
    address: api.address,
    logo: api.logo,
    registrationNumber: api.registration_number,
    primaryContactName: api.primary_contact_name,
    primaryContactTitle: api.primary_contact_title,
    verificationStatus: api.verification_status,
  }
}

/** GET /companies/me/ — full own Company profile, including private fields. */
export async function getCompanyProfile(): Promise<CompanyProfile> {
  const company = await request<ApiCompany>('/companies/me/')
  return mapCompany(company)
}

/**
 * PATCH /companies/me/ — any subset of editable fields. Pass `logoFile` to
 * upload a new logo (multipart); the caller clears a logo with
 * {@link clearCompanyLogo}, which sends `logo: null`.
 */
export async function updateCompanyProfile(
  patch: CompanyProfilePatch,
  logoFile?: File,
): Promise<CompanyProfile> {
  if (logoFile) {
    const body = new FormData()
    body.append('logo', logoFile)
    for (const [key, value] of Object.entries(patch)) {
      body.append(key, String(value))
    }
    const company = await request<ApiCompany>('/companies/me/', { method: 'PATCH', body })
    return mapCompany(company)
  }
  const company = await request<ApiCompany>('/companies/me/', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return mapCompany(company)
}

/** Clears the company logo with an explicit `logo: null`. */
export async function clearCompanyLogo(): Promise<CompanyProfile> {
  const company = await request<ApiCompany>('/companies/me/', {
    method: 'PATCH',
    body: JSON.stringify({ logo: null }),
  })
  return mapCompany(company)
}

/** Dashboard metrics scoped to the caller's placements. */
export async function getCompanySummary(): Promise<CompanySummary> {
  const metrics = await request<ApiCompanyMetrics>('/company/summary/')
  return {
    activePlacements: metrics.active_placements,
    applicants: metrics.applicants,
    shortlisted: metrics.shortlisted,
    hired: metrics.hired,
  }
}

/** Public company profile by slug (no private fields; 404 when not exposed). */
export async function getPublicCompany(slug: string): Promise<PublicCompany> {
  const company = await request<ApiPublicCompany>(`/companies/${encodeURIComponent(slug)}/`)
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    website: company.website,
    industry: company.industry,
    description: company.description,
    country: company.country,
    city: company.city,
    address: company.address,
    logoUrl: company.logo_url,
    verificationStatus: company.verification_status,
  }
}
