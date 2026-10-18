import { ArrowRight, Search } from 'lucide-react'
import { useId, useState } from 'react'
import { useNavigate } from 'react-router'

import { hero } from '@/features/landing/data'
import { cn } from '@/lib/utils'

/** Frosted hero search bar plus the work-mode filter chips beneath it. */
export default function HeroSearch() {
  const inputId = useId()
  const navigate = useNavigate()
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  function toggleFilter(filter: string) {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    )
  }

  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const params = new URLSearchParams({ q: String(data.get('query') || '') })
          if (activeFilters.length) params.set('styles', activeFilters.join(','))
          navigate(`/student/discover?${params}`)
        }}
        className="surface-frost mx-auto flex h-[51px] w-full max-w-[680px] items-center gap-2 rounded-[12px] pl-4 pr-1"
      >
        <Search className="size-4 shrink-0 text-cream" aria-hidden />
        <label htmlFor={inputId} className="sr-only">
          Search internships
        </label>
        <input
          id={inputId}
          name="query"
          type="search"
          placeholder={hero.searchPlaceholder}
          className="h-full w-full bg-transparent text-sm font-medium tracking-[-0.05em] text-cream outline-none placeholder:text-cream/65"
        />
        <button
          type="submit"
          aria-label="Search"
          className="grid h-[43px] w-[68px] shrink-0 place-items-center rounded-[9px] bg-brand text-cream transition hover:bg-brand-strong"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
        {hero.filters.map((filter) => {
          const isActive = activeFilters.includes(filter)
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => toggleFilter(filter)}
              className={cn(
                'rounded-lg p-2.5 text-sm font-medium tracking-[-0.05em] transition',
                isActive ? 'bg-brand text-cream' : 'bg-[#e4e4e4] text-ink hover:bg-white',
              )}
            >
              {filter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
