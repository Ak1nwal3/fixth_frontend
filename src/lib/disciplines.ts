/**
 * Engineering disciplines offered by Nigerian universities and polytechnics
 * (NUC/COREN programme names). Students pick their course from this list and
 * companies pick the eligible discipline(s) for a placement, so both sides use
 * identical names. The backend checks eligibility by exact discipline match,
 * so free-typed spellings ("CMP", "Comp. Eng") would silently break matching.
 */
export const ENGINEERING_DISCIPLINES = [
  'Aerospace Engineering',
  'Agricultural and Bio-Resources Engineering',
  'Agricultural Engineering',
  'Automotive Engineering',
  'Biomedical Engineering',
  'Building Technology',
  'Ceramic Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Engineering',
  'Electrical and Electronics Engineering',
  'Electrical Engineering',
  'Electronic and Computer Engineering',
  'Electronics Engineering',
  'Environmental Engineering',
  'Food Science and Engineering',
  'Industrial and Production Engineering',
  'Information and Communication Engineering',
  'Marine Engineering',
  'Materials and Metallurgical Engineering',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Naval Architecture',
  'Petroleum and Gas Engineering',
  'Petroleum Engineering',
  'Polymer and Textile Engineering',
  'Quantity Surveying',
  'Robotics and Automation Engineering',
  'Software Engineering',
  'Structural Engineering',
  'Surveying and Geoinformatics',
  'Systems Engineering',
  'Telecommunications Engineering',
  'Water Resources and Environmental Engineering',
  'Wood Products Engineering',
] as const

/**
 * Whether a placement may list more than one eligible discipline.
 *
 * The API stores one discipline per placement and only lets a student apply on
 * an exact match. Saving several joined together would make the placement
 * ineligible for everyone, so this stays off until the backend accepts a list
 * (see `encodeDisciplines`). Set VITE_MULTI_DISCIPLINE=true to switch it on.
 */
export const MULTI_DISCIPLINE = import.meta.env.VITE_MULTI_DISCIPLINE === 'true'

/** Separator used when several disciplines share the single `discipline` field. */
const SEPARATOR = ' | '

/** Joins selected disciplines into the single string the API stores. */
export function encodeDisciplines(values: readonly string[]): string {
  return values.map(value => value.trim()).filter(Boolean).join(SEPARATOR)
}

/** Splits a stored discipline string back into its individual disciplines. */
export function decodeDisciplines(value: string | null | undefined): string[] {
  if (!value) return []
  return value.split('|').map(item => item.trim()).filter(Boolean)
}

/** Human-readable list for display: "A", "A or B", "A, B or C". */
export function disciplineLabel(value: string | null | undefined): string {
  const items = decodeDisciplines(value)
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}
