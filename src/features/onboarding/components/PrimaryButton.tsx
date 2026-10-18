import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

/** Brand-blue action. Defaults to `type="button"` so it never submits by accident. */
export default function PrimaryButton({ className, type = 'button', ...props }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex min-h-11 items-center justify-center rounded-[10px] bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
