/**
 * Typed, centralised access to Vite environment variables.
 * Add new variables to `.env.example` and to `src/vite-env.d.ts`.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
