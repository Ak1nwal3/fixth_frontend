import { cn } from '@/lib/utils'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  type?: string
  className?: string
}

/** Labelled text control: 13px semibold label over a 46px bordered input. */
export default function TextField({
  id,
  label,
  value,
  onChange,
  type = 'email',
  className,
}: TextFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-[46px] w-full rounded-[10px] border border-line-strong bg-white px-[13px] text-[13px] font-medium text-navy outline-none transition focus:border-brand"
      />
    </div>
  )
}
