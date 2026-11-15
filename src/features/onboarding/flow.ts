export type Track = 'organization' | 'student'
export type Draft = Record<string, string>
export interface Field { name: string; label: string; type?: string; options?: string[]; placeholder?: string; optional?: boolean }
export interface Step { slug: string; title: string; subtitle: string; story: string; fields?: Field[]; upload?: string }
const email: Step = { slug: 'email', title: 'Verify your work email', subtitle: 'We’ll send a one-time code to confirm your organization email.', story: 'Connect with engineering talent ready to make an impact.', fields: [{ name: 'email', label: 'Company email', type: 'email', placeholder: 'hello@yourcompany.com' }] }
const code: Step = { slug: 'code', title: 'Enter your verification code', subtitle: 'Enter the 6-digit code sent to your email.', story: 'One quick check, then we’ll set up your organization.' }
const password: Step = { slug: 'password', title: 'Create your password', subtitle: 'Use at least 8 characters with a letter and a number.', story: 'One password, then your profile is ready to go.' }
export const flows: Record<Track, Step[]> = {
  organization: [email, code, { ...password, story: 'One password, then your organization is ready to go.' },
    { slug: 'details', title: 'Organization details', subtitle: 'Tell students the essentials about your organization.', story: 'Build a credible presence students can trust.', upload: 'Upload logo', fields: [{ name: 'organization', label: 'Organization name' }, { name: 'website', label: 'Website', placeholder: 'yourcompany.com', optional: true }, { name: 'industry', label: 'Industry', options: ['Technology', 'Engineering', 'Construction', 'Manufacturing', 'Energy', 'Other'] }] },
    { slug: 'story', title: 'Tell students about you', subtitle: 'Help candidates understand your mission and location.', story: 'Share what makes your organization a great place to grow.', fields: [{ name: 'description', label: 'Short description', type: 'textarea', optional: true }, { name: 'country', label: 'Country' }, { name: 'city', label: 'City' }, { name: 'address', label: 'Office address', optional: true }] },
    { slug: 'review', title: 'Review your organization', subtitle: 'Confirm your information before publishing.', story: 'You’re ready to meet your next great intern.' }],
  student: [{ ...email, title: 'Verify your student email', subtitle: 'We’ll send a one-time code to confirm your email address.', story: 'Start with the email your school or institution knows.', fields: [{ name: 'email', label: 'Student email address', type: 'email', placeholder: 'you@university.edu.ng' }] },
    { ...code, story: 'One quick check, then we’ll build your profile together.' },
    { ...password, story: 'One password, then we’ll build your profile together.' },
    { slug: 'about', title: 'Tell us about you', subtitle: 'Add the essentials recruiters will see first.', story: 'Your next opportunity starts with a profile that feels like you.', upload: 'Upload photo', fields: [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'phone', label: 'Phone number', type: 'tel' }, { name: 'location', label: 'Location', placeholder: 'City, country' }] },
    { slug: 'education', title: 'Your education', subtitle: 'Help us find relevant opportunities.', story: 'Your next opportunity starts with a profile that feels like you.', fields: [{ name: 'institution', label: 'Institution' }, { name: 'course', label: 'Course of study' }, { name: 'level', label: 'Level', options: ['100 level', '200 level', '300 level', '400 level', '500 level', '600 level', '700 level'] }] },
    { slug: 'skills', title: 'Showcase your skills', subtitle: 'Pick strengths that represent you.', story: 'Your next opportunity starts with a profile that feels like you.' },
    { slug: 'review', title: 'Review your profile', subtitle: 'Confirm your details before finishing.', story: 'Your next opportunity starts with a profile that feels like you.' }],
}

/** Parses a level option such as "400 level" into the API's 100–700 integer, or null. */
export function parseLevel(value: string | undefined): number | null {
  const level = Number.parseInt(value ?? '', 10)
  return Number.isInteger(level) && level >= 100 && level <= 700 && level % 100 === 0 ? level : null
}

/**
 * Credentials and one-time secrets are never written to sessionStorage, where
 * any script on the origin could read them. They live in memory for this tab
 * only; after a reload the flow guards send the user back to re-enter them.
 */
const SENSITIVE_KEYS = ['password', 'passwordSet', 'code', 'verificationToken', 'demoOtp'] as const
const memory: Record<Track, Draft> = { organization: {}, student: {} }

function storageKey(track: Track) {
  return `fixth-onboarding-${track}`
}

export function readDraft(track: Track): Draft {
  let stored: Draft = {}
  try {
    stored = JSON.parse(sessionStorage.getItem(storageKey(track)) || '{}') as Draft
  } catch {
    stored = {}
  }
  // Drafts written by older builds may still hold secrets; never read them back.
  for (const key of SENSITIVE_KEYS) delete stored[key]
  return { ...stored, ...memory[track] }
}

export function saveDraft(track: Track, draft: Draft) {
  const persisted: Draft = { ...draft }
  const secrets: Draft = {}
  for (const key of SENSITIVE_KEYS) {
    if (draft[key] !== undefined) secrets[key] = draft[key]
    delete persisted[key]
  }
  memory[track] = secrets
  try {
    sessionStorage.setItem(storageKey(track), JSON.stringify(persisted))
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

export function clearDraft(track: Track) {
  memory[track] = {}
  try {
    sessionStorage.removeItem(storageKey(track))
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}
