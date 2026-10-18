import { Children, cloneElement, createContext, isValidElement, useContext, useId, useState, type ReactNode, type ReactElement, type FormHTMLAttributes, type LabelHTMLAttributes, type InputHTMLAttributes } from 'react'
const ErrorContext = createContext<Record<string, string>>({})
export function ValidatedForm({ children, onSubmit, onInvalidCapture, onInputCapture, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  return <ErrorContext value={errors}><form {...props} onSubmit={event => {
    const controls = Array.from(event.currentTarget.elements)
    const invalid = controls.find(element => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || !element.required || element.type === 'file') return false
      return !element.value.trim() || element.minLength > 0 && element.value.trim().length < element.minLength
    }) as HTMLInputElement | HTMLTextAreaElement | undefined
    if (invalid) {
      event.preventDefault()
      invalid.setCustomValidity('Enter a complete value, rather than spaces.')
      invalid.reportValidity()
      invalid.focus()
      return
    }
    onSubmit?.(event)
  }} onInvalidCapture={event => {
    const target = event.target as HTMLInputElement
    if (target.name) setErrors(current => ({ ...current, [target.name]: target.validationMessage }))
    onInvalidCapture?.(event)
  }} onInputCapture={event => {
    const target = event.target as HTMLInputElement
    target.setCustomValidity?.('')
    if (target.name) setErrors(current => ({ ...current, [target.name]: '' }))
    onInputCapture?.(event)
  }}>{children}</form></ErrorContext>
}
export function Field({ children, className = 'p-field', ...props }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  const errors = useContext(ErrorContext)
  const errorId = useId()
  const error = Children.toArray(children).flatMap(child => {
    if (!isValidElement(child) || !['input', 'select', 'textarea'].includes(String(child.type))) return []
    const name = (child as ReactElement<InputHTMLAttributes<HTMLInputElement>>).props.name || ''
    return errors[name] ? [errors[name]] : []
  })[0] || ''
  const controls = Children.map(children, child => {
    if (!isValidElement(child) || !['input', 'select', 'textarea'].includes(String(child.type))) return child
    const control = child as ReactElement<InputHTMLAttributes<HTMLInputElement>>
    const fieldError = errors[control.props.name || '']
    if (!fieldError) return child
    return cloneElement(control, { 'aria-invalid': true, 'aria-describedby': [control.props['aria-describedby'], errorId].filter(Boolean).join(' ') })
  })
  return <label className={className} {...props}>{controls}{error && <span className="p-error" id={errorId}>{error}</span>}</label>
}
