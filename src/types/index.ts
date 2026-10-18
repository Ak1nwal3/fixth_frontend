/**
 * Shared, cross-cutting TypeScript types.
 * Feature-specific types belong next to the feature in `src/features/*`.
 */

export type Nullable<T> = T | null

export interface ApiErrorBody {
  message: string
  code?: string
}
