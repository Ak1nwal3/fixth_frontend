/**
 * Landing-page imagery, in one place.
 *
 * Final artwork lives in `./images/`, temporary stand-ins in `./placeholders/`.
 * Swap one import below when a placeholder gets replaced — no component needs
 * to change.
 */
import midSectionIllustration from './images/mid-section.svg'
import onboardingBrandPanel from './images/onboarding/brand-panel.png'
import onboardingOrganizationEmailBrand from './images/onboarding/organization-email-brand.png'
import onboardingStudentEmailBrand from './images/onboarding/student-email-brand.png'
import onePlatformIllustration from './images/one-platform.png'
import avatarJohnDoe from './placeholders/avatar-john-doe.svg'
import avatarKateEting from './placeholders/avatar-kate-eting.svg'
import avatarMatthewEjeo from './placeholders/avatar-matthew-ejeo.svg'
import avatarSarahJones from './placeholders/avatar-sarah-jones.svg'
import logoOriginSteel from './placeholders/logo-origin-steel.svg'
import logoWaterwaySteel from './placeholders/logo-waterway-steel.svg'
import photoCandidate from './placeholders/photo-candidate.svg'
import photoInterviewer from './placeholders/photo-interviewer.svg'

/**
 * The "match flow" artwork under the trust heading, exported from the design.
 *
 * Self-contained: the avatars are embedded as base64 rasters inside the SVG, so
 * it drops straight into an `<img>`.
 */
export const midSection = midSectionIllustration

/**
 * The "platform" artwork under the heading "One platform, every engineering
 * opportunity." — the three feature rows (placements, training, internships)
 * exported from the design as one transparent PNG, so it drops onto the
 * royal-blue band.
 */
export const onePlatform = onePlatformIllustration

export const avatars = {
  johnDoe: avatarJohnDoe,
  kateEting: avatarKateEting,
  sarahJones: avatarSarahJones,
  matthewEjeo: avatarMatthewEjeo,
} as const

export const photos = {
  interviewer: photoInterviewer,
  candidate: photoCandidate,
} as const

export const companyLogos = {
  waterwaySteel: logoWaterwaySteel,
  originSteel: logoOriginSteel,
} as const

/**
 * Shared brand-panel artwork for every onboarding and auth step: the blue
 * glow with the overlapping circle motif, cropped from the reference design.
 *
 * It carries no copy — each step overlays its own headline, so one image
 * serves every page of both the student and organization tracks.
 */
export const brandPanel = onboardingBrandPanel

/**
 * Onboarding & auth brand-panel artwork.
 *
 * Each reference screen exports as one 1440×960 image; the left 520×960 panel
 * is cropped out and used as the fixed brand panel beside the form.
 */
export const onboarding = {
  organizationEmailBrand: onboardingOrganizationEmailBrand,
  studentEmailBrand: onboardingStudentEmailBrand,
} as const
