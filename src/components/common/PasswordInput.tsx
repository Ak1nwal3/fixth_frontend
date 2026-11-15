import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * Password field with an eye button that reveals what was typed, so people
 * can check a new or confirmed password before submitting. Each field toggles
 * independently. All other props go straight to the underlying `<input>`, so
 * it keeps working inside `Field`, `.auth-field`, and `.p-field` wrappers.
 */
export default function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Hide password' : 'Show password'
  return (
    <span className="password-input">
      <input {...props} disabled={disabled} className={className} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-input-toggle"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        disabled={disabled}
        // Keep focus (and the caret position) in the input while toggling.
        onMouseDown={event => event.preventDefault()}
        onClick={() => setVisible(value => !value)}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </span>
  )
}
