import { onboarding } from '@/assets'

/* -------------------------------------------------------------------------- */
/*                                  Onboarding                                */
/* -------------------------------------------------------------------------- */

export interface EmailStepContent {
  /** Brand-panel artwork shown beside the form. */
  brand: string
  /** Uppercase caption above the heading, e.g. "Organization profile · Step 1 of 5". */
  eyebrow: string
  /** Number of segments in the progress bar. */
  steps: number
  /** 1-based index of the active segment. */
  current: number
  title: string
  subtitle: string
  fieldLabel: string
  /** Value shown pre-filled in the design. */
  fieldValue: string
  submit: string
  note: string
}

/** Organisation track — step 1 of 5. */
export const organizationEmail: EmailStepContent = {
  brand: onboarding.organizationEmailBrand,
  eyebrow: 'Organization profile · Step 1 of 5',
  steps: 5,
  current: 1,
  title: 'Verify your work email',
  subtitle: 'We’ll send a one-time code to confirm your organization email.',
  fieldLabel: 'Company email',
  fieldValue: 'hello@fixth.com',
  submit: 'Send verification code',
  note: 'Your company email stays private and secure.',
}

/** Student track — step 1 of 7. */
export const studentEmail: EmailStepContent = {
  brand: onboarding.studentEmailBrand,
  eyebrow: 'Student profile · Step 1 of 7',
  steps: 7,
  current: 1,
  title: 'Verify your student email',
  subtitle: 'We’ll send a one-time code to confirm your email address.',
  fieldLabel: 'Student email address',
  fieldValue: 'johndoe@university.edu.ng',
  submit: 'Send verification code',
  note: 'Your email stays private and secure.',
}
