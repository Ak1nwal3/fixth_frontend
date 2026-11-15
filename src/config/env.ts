/**
 * Typed, centralised access to Vite environment variables.
 * Add new variables to `.env.example` and to `src/vite-env.d.ts`.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  /**
   * Display the OTP the backend returns when it cannot send email. This
   * bypasses email verification, so only enable it on throwaway demo builds.
   */
  showDemoOtp: import.meta.env.VITE_SHOW_DEMO_OTP === 'true',
  /** The Trust & Safety workspace is a local mock; production builds hide it unless enabled. */
  showAdminPreview: import.meta.env.DEV || import.meta.env.VITE_SHOW_ADMIN_PREVIEW === 'true',
} as const
