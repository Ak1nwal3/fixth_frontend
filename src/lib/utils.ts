/**
 * Tiny class-name joiner. Swap for `clsx` / `tailwind-merge` when needed.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
