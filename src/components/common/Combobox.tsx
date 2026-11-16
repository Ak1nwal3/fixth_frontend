import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface BaseProps {
  options: readonly string[]
  name?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  /** Accept a typed value that is not in `options` (e.g. an unlisted university). */
  allowCustom?: boolean
  invalid?: boolean
  'aria-describedby'?: string
  /** Shown when strict mode rejects typed text. */
  pickMessage?: string
}

interface SingleProps extends BaseProps {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

interface MultipleProps extends BaseProps {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
  /** Maximum number of selections. */
  max?: number
}

type ComboboxProps = SingleProps | MultipleProps

const MAX_RESULTS = 60

/** Case-insensitive match on every word, with prefix matches ranked first. */
function filterOptions(options: readonly string[], query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return options.slice(0, MAX_RESULTS)
  const lower = query.trim().toLowerCase()
  return options
    .filter(option => {
      const text = option.toLowerCase()
      return words.every(word => text.includes(word))
    })
    .sort((a, b) => Number(!a.toLowerCase().startsWith(lower)) - Number(!b.toLowerCase().startsWith(lower)))
    .slice(0, MAX_RESULTS)
}

/**
 * Searchable select. Typing filters the list; arrow keys, Enter, and Escape
 * work as in a native select. In strict mode (no `allowCustom`) only listed
 * options can be committed, which keeps disciplines spelled identically for
 * students and companies.
 */
export default function Combobox(props: ComboboxProps) {
  const { options, name, placeholder, required, disabled, allowCustom, invalid, pickMessage } = props
  const autoId = useId()
  const inputId = props.id ?? `${autoId}-input`
  const listId = `${autoId}-list`
  const hintId = `${autoId}-hint`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [hint, setHint] = useState('')

  const multiple = props.multiple === true
  const rawValue = props.value
  const selected = useMemo(
    () => (Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []),
    [rawValue],
  )
  const full = props.multiple && props.max !== undefined && selected.length >= props.max
  const searchText = editing ? query : ''
  const matches = useMemo(() => {
    const list = filterOptions(options, searchText)
    return multiple ? list.filter(option => !selected.includes(option)) : list
  }, [options, searchText, multiple, selected])
  const trimmed = query.trim()
  const exact = options.find(option => option.toLowerCase() === trimmed.toLowerCase())
  const showCustom = allowCustom && editing && !!trimmed && !exact && !selected.includes(trimmed)
  const items = showCustom ? [...matches, trimmed] : matches

  const commit = (option: string) => {
    setHint('')
    if (props.multiple) {
      if (!selected.includes(option) && !full) props.onChange([...selected, option])
      setQuery('')
      setActive(0)
      // Stay open so several disciplines can be picked in a row.
      inputRef.current?.focus()
      return
    }
    props.onChange(option)
    setQuery('')
    setEditing(false)
    setOpen(false)
  }

  const remove = (option: string) => {
    if (props.multiple) props.onChange(selected.filter(item => item !== option))
  }

  /** Resolves typed text when focus leaves: exact match, custom, or revert. */
  const settle = () => {
    setOpen(false)
    if (!editing) return
    setEditing(false)
    setQuery('')
    if (!trimmed) {
      if (!props.multiple) props.onChange('')
      return
    }
    if (exact) {
      if (props.multiple) {
        if (!selected.includes(exact) && !full) props.onChange([...selected, exact])
      } else props.onChange(exact)
      setHint('')
    } else if (allowCustom) {
      if (props.multiple) {
        if (!full) props.onChange([...selected, trimmed])
      } else props.onChange(trimmed)
    } else {
      setHint(pickMessage ?? 'Choose an option from the list.')
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive(current => (items.length ? (current + step + items.length) % items.length : 0))
    } else if (event.key === 'Enter') {
      if (open && items[active] !== undefined) {
        event.preventDefault()
        commit(items[active])
      }
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
      }
    } else if (event.key === 'Backspace' && props.multiple && !query && selected.length) {
      remove(selected[selected.length - 1]!)
    }
  }

  const display = props.multiple ? query : editing ? query : props.value
  const describedBy = [props['aria-describedby'], hint ? hintId : ''].filter(Boolean).join(' ') || undefined

  return (
    <span className="combo" data-multiple={props.multiple || undefined}>
      {props.multiple && selected.length > 0 && (
        <span className="combo-chips">
          {selected.map(option => (
            <span className="combo-chip" key={option}>
              {option}
              <button
                type="button"
                aria-label={`Remove ${option}`}
                disabled={disabled}
                onMouseDown={event => event.preventDefault()}
                onClick={() => remove(option)}
              >
                <X size={13} aria-hidden />
              </button>
            </span>
          ))}
        </span>
      )}
      <span className="combo-input">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && items[active] !== undefined ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || !!hint || undefined}
          aria-describedby={describedBy}
          placeholder={full ? 'Maximum reached' : placeholder}
          // Single mode: the input holds the committed value, so native
          // `required` works. Multiple mode validates in the parent form.
          required={!props.multiple && required}
          disabled={disabled || full}
          value={display}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={event => {
            setEditing(true)
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
            setHint('')
          }}
          onBlur={settle}
          onKeyDown={onKeyDown}
        />
        <ChevronDown className="combo-caret" size={16} aria-hidden />
      </span>
      {open && !disabled && (
        <ul className="combo-list" id={listId} role="listbox" aria-multiselectable={props.multiple || undefined}>
          {items.length === 0 && <li className="combo-empty">No matches. {allowCustom ? 'Keep typing to use your own entry.' : 'Try another spelling.'}</li>}
          {items.map((option, index) => {
            const custom = showCustom && index === items.length - 1
            const isSelected = !custom && selected.includes(option)
            return (
              <li
                key={`${custom ? 'custom:' : ''}${option}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                data-active={index === active || undefined}
                onMouseDown={event => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(option)}
              >
                {custom ? <>Use “{option}”</> : option}
                {isSelected && <Check size={14} aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
      {hint && (
        <span className="combo-hint" id={hintId} role="alert">
          {hint}
        </span>
      )}
    </span>
  )
}
