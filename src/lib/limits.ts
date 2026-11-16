/**
 * Field length limits enforced by the Fixth API (Fixth__Back models and
 * serializers). Inputs use these as soft limits: people can keep typing, a
 * live counter turns red past the limit, and the form will not submit until
 * the text fits. That beats a hard `maxLength`, which silently cuts off
 * pasted text, and beats finding out from a server error after submitting.
 */
export const LIMITS = {
  // Student profile (profiles.StudentProfile)
  studentFirstName: 100,
  studentLastName: 100,
  phone: 30,
  studentLocation: 160,
  institution: 200,
  discipline: 120,
  studentId: 80,
  studentDuration: 80,
  portfolio: 300,
  // Account (/auth/{role}/me/)
  accountName: 150,
  // Company (companies.Company)
  companyName: 200,
  website: 300,
  companyDescription: 500,
  country: 100,
  city: 100,
  address: 255,
  registrationNumber: 80,
  contactName: 150,
  contactTitle: 150,
  // Placement (placements.Placement)
  placementTitle: 200,
  placementLocation: 160,
  placementDuration: 50,
  // Application status change reason
  decisionReason: 2000,
} as const

/** Error text for a value over its limit, or '' when it fits. */
export function lengthError(value: string | null | undefined, max: number): string {
  const length = (value ?? '').length
  if (length <= max) return ''
  const over = length - max
  return `Too long: ${length} of ${max} characters. Remove ${over} character${over === 1 ? '' : 's'}.`
}

/**
 * Finds the first control in a form whose text is longer than its `data-max`
 * attribute. Forms call this on submit so over-limit text never reaches the API.
 */
export function firstOverLimit(form: HTMLFormElement): { element: HTMLInputElement | HTMLTextAreaElement; message: string } | null {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) continue
    const max = Number(element.dataset.max)
    if (!max) continue
    const message = lengthError(element.value, max)
    if (message) return { element, message }
  }
  return null
}
