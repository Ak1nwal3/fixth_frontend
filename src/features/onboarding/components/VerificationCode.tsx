import { useRef } from 'react'
interface Props { value: string; onChange: (value: string) => void; invalid?: boolean }
export default function VerificationCode({ value, onChange, invalid }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  function fill(index: number, text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6 - index)
    const next = Array.from({ length: 6 }, (_, i) => value[i] || ' ')
    if (!digits) next[index] = ' '
    else Array.from(digits).forEach((digit, offset) => { next[index + offset] = digit })
    onChange(next.join('').trimEnd())
    if (digits) inputs.current[Math.min(index + digits.length, 5)]?.focus()
  }
  return <fieldset className="auth-otp"><legend>Verification code</legend><div>{Array.from({ length: 6 }, (_, index) => <input key={index} ref={element => { inputs.current[index] = element }} aria-label={`Verification digit ${index + 1} of 6`} name={`code-${index + 1}`} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} required pattern="[0-9]" value={value[index]?.trim() || ''} aria-invalid={invalid || undefined} aria-describedby={invalid ? 'code-error verification-note' : 'verification-note'} onFocus={e => e.target.select()} onChange={e => fill(index, e.target.value)} onPaste={e => { e.preventDefault(); fill(index, e.clipboardData.getData('text')) }} onKeyDown={e => { if (e.key === 'ArrowLeft' && index) { e.preventDefault(); inputs.current[index - 1]?.focus() } if (e.key === 'ArrowRight' && index < 5) { e.preventDefault(); inputs.current[index + 1]?.focus() } if (e.key === 'Backspace' && !value[index]?.trim() && index) { e.preventDefault(); fill(index - 1, ''); inputs.current[index - 1]?.focus() } }} />)}</div></fieldset>
}
