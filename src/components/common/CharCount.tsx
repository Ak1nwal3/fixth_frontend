import { lengthError } from '@/lib/limits'

/**
 * Live character counter for a text field. Hidden until the text reaches 80%
 * of the limit (or always, for long-form textareas); turns red with a clear
 * message once the text is over the limit.
 */
export default function CharCount({ value, max, always = false, id }: { value: string | null | undefined; max: number; always?: boolean; id?: string }) {
  const length = (value ?? '').length
  const error = lengthError(value, max)
  if (!error && !always && length < max * 0.8) return null
  return (
    <span id={id} className="char-count" data-over={error ? true : undefined} aria-live="polite">
      {error || `${length} / ${max}`}
    </span>
  )
}
