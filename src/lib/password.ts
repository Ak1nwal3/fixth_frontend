export interface PasswordRule {
  id: string
  label: string
  test: (value: string) => boolean
}

/**
 * Client-side password policy. The API must enforce the same rules and hash the
 * value server-side (argon2id/bcrypt) — these checks are only here to guide the user.
 */
export const passwordRules: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (value) => /[a-z]/i.test(value) },
  { id: 'number', label: 'At least one number', test: (value) => /\d/.test(value) },
]

/** Number of satisfied rules, used to render a strength meter. */
export function passwordStrength(value: string) {
  return passwordRules.filter((rule) => rule.test(value)).length
}

/** First rule the value breaks, or `null` when it passes every rule. */
export function passwordError(value: string, email = '') {
  const failing = passwordRules.find((rule) => !rule.test(value))
  if (failing) return `Your password needs ${failing.label.toLowerCase()}.`
  if (email && value.trim().toLowerCase() === email.trim().toLowerCase()) {
    return 'Choose a password that isn’t your email address.'
  }
  return null
}
