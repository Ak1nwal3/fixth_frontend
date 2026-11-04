import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Bookmark, MapPin, Clock3, GraduationCap, ArrowRight, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useApiData } from '@/hooks/useApiData'
import { ApiError } from '@/services/http'
import { getPlacementById, getPlacementBySlug, listPlacements, type StudentPlacement } from '@/services/placements'
import { listDisciplines } from '@/services/reference'
import { apiErrorMessage } from '@/services/types'
import { Badge, Panel, Empty, Modal, CopyLink } from './components/ui'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function PlacementCard({ placement }: { placement: StudentPlacement }) {
  return <article className="p-placement-card"><div className="p-between"><div className="p-identity"><span className="p-company-mark">{placement.company[0]}</span><div><h2><Link to={`/p/${placement.slug}`}>{placement.title}</Link></h2><p>{placement.company} {placement.companyVerified && <ShieldCheck aria-label="Verified company" size={14} className="p-inline-success" />}</p></div></div><button className="p-icon" type="button" disabled title="Saving placements is coming soon" aria-label={`Save ${placement.title} (coming soon)`} aria-pressed={placement.isSaved}><Bookmark size={18} aria-hidden fill={placement.isSaved ? 'currentColor' : 'none'} /></button></div><div className="p-tags"><span><MapPin aria-hidden size={13} />{placement.location} · {placement.workStyle}</span><span><Clock3 aria-hidden size={13} />{placement.duration}</span><span><GraduationCap aria-hidden size={13} />{placement.discipline}</span></div><div className="p-between p-card-foot"><span>Verified placement</span>{placement.match != null && <strong>{placement.match}% match</strong>}</div></article>
}

export function DiscoverPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [workStyles, setWorkStyles] = useState<string[]>((params.get('styles') || '').split(',').filter(Boolean))
  const [discipline, setDiscipline] = useState('All disciplines')
  const [location, setLocation] = useState('All locations')
  const [duration, setDuration] = useState('Any duration')
  const [sort, setSort] = useState('Best match')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debouncedQuery = useDebounced(query, 300)

  const [items, setItems] = useState<StudentPlacement[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const facets = useRef<{ locations: Set<string>; durations: Set<string> }>({ locations: new Set(), durations: new Set() })

  const listParams = {
    q: debouncedQuery || undefined,
    discipline: discipline === 'All disciplines' ? undefined : discipline,
    location: location === 'All locations' ? undefined : location,
    duration: duration === 'Any duration' ? undefined : duration,
    workStyles,
    saved: savedOnly || undefined,
    sort: (sort === 'Best match' ? 'match' : 'title') as 'match' | 'title',
  }
  const filterKey = [debouncedQuery, discipline, location, duration, workStyles.join(','), sort, savedOnly, attempt]

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    listPlacements({ ...listParams, page: 1 })
      .then(result => {
        if (!live) return
        result.results.forEach(p => {
          facets.current.locations.add(p.location)
          facets.current.durations.add(p.duration)
        })
        setItems(result.results)
        setCount(result.count)
        setHasMore(!!result.next)
        setPage(1)
      })
      .catch((err: unknown) => {
        if (!live) return
        setItems([])
        setCount(0)
        setHasMore(false)
        setError(
          err instanceof ApiError
            ? err.status === 429
              ? 'Too many requests. Please wait a moment and try again.'
              : apiErrorMessage(err.body, 'Placements could not be loaded.')
            : 'Could not reach the server. Check your connection and try again.',
        )
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, filterKey)

  const loadMore = () => {
    const nextPage = page + 1
    setLoadingMore(true)
    listPlacements({ ...listParams, page: nextPage })
      .then(result => {
        result.results.forEach(p => {
          facets.current.locations.add(p.location)
          facets.current.durations.add(p.duration)
        })
        setItems(current => [...current, ...result.results])
        setHasMore(!!result.next)
        setPage(nextPage)
      })
      .catch(() => setError('More placements could not be loaded. Try again.'))
      .finally(() => setLoadingMore(false))
  }

  const disciplines = useApiData(() => listDisciplines(), [])
  const disciplineOptions = ['All disciplines', ...new Set([...(disciplines.data?.map(d => d.name) ?? []), ...items.map(p => p.discipline)])]
  const locationOptions = ['All locations', ...facets.current.locations]
  const durationOptions = ['Any duration', ...facets.current.durations]

  const controls = <>
    <label className="p-field"><span>Discipline</span><select value={discipline} onChange={e => setDiscipline(e.target.value)}>{disciplineOptions.map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="p-field"><span>Location</span><select value={location} onChange={e => setLocation(e.target.value)}>{locationOptions.map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="p-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{durationOptions.map(value => <option key={value}>{value}</option>)}</select></label>
  </>
  return <div className="p-columns"><div>
    <div className="p-toolbar"><label className="p-search"><span className="p-sr">Search role, company or skill</span><input type="search" value={query} placeholder="Search role, company or skill" onChange={e => setQuery(e.target.value)} /></label>
      <div className="p-discovery-filters">{controls}</div>
      <div className="p-mobile-filter-buttons">{['Discipline', 'Location', 'Duration'].map(label => <button type="button" className="p-button secondary" key={label} onClick={() => setFiltersOpen(true)}>{label}</button>)}</div>
      {workStyles.length > 0 && <button type="button" className="p-button subtle" onClick={() => setWorkStyles([])}>Clear {workStyles.join(' · ')} filter</button>}
    </div>
    <div className="p-between p-result-count"><p role="status">{loading ? 'Loading placements…' : `${count} ${savedOnly ? 'saved' : 'verified'} placements`}</p><label><span className="p-sr">Sort placements</span><select value={sort} onChange={e => setSort(e.target.value)}><option>Best match</option><option>Title A–Z</option></select></label></div>
    {error && <Panel><Empty title="Placements could not be loaded"><p>{error}</p><button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></Empty></Panel>}
    {!error && <div className="p-stack">{loading ? <Panel><p role="status">Loading placements…</p></Panel> : items.length ? <>{items.map(p => <PlacementCard key={p.id} placement={p} />)}{hasMore && <button type="button" className="p-button secondary" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading…' : 'Load more placements'}</button>}</> : <Panel><Empty title={savedOnly ? 'No saved placements yet' : 'No matching placements'}><p>{savedOnly ? 'Saving placements is coming soon. Saved roles will appear here.' : 'Try a different role, location, or discipline.'}</p>{!savedOnly && <Link className="p-button" to="/student/discover">Discover placements</Link>}</Empty></Panel>}</div>}
  </div><aside className="p-stack p-secondary-rail"><Panel><div className="p-between"><h2>Application profile</h2><Badge>One-click apply</Badge></div><p>Your Fixth profile and resume are used for one-click applications. Applications open soon.</p><Link className="p-file" to="/student/resume"><FileText size={20} aria-hidden /><span>Manage your resume<small>Resume preferences →</small></span></Link></Panel><Panel className="tinted"><p className="p-eyebrow">Placement alerts</p><h2>Get notified first</h2><p>Verified roles are matched to your discipline. Keep your profile preferences up to date.</p><Link to="/student/profile/edit" className="p-text-link">Update preferences →</Link></Panel></aside>
  {filtersOpen && <Modal title="Filter placements" onClose={() => setFiltersOpen(false)}><div className="p-form">{controls}<button type="button" className="p-button" onClick={() => { setDiscipline('All disciplines'); setLocation('All locations'); setDuration('Any duration'); setWorkStyles([]) }}>Reset filters</button><button type="button" className="p-button" onClick={() => setFiltersOpen(false)}>Show {count} placements</button></div></Modal>}
  </div>
}

export function PlacementDetailPage() {
  const { slug, id } = useParams()
  const { user } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const { status, data: placement, error } = useApiData(
    () => (slug ? getPlacementBySlug(slug) : getPlacementById(id!)),
    [slug, id, attempt],
  )
  if (status === 'loading') return <Panel><p role="status">Loading placement…</p></Panel>
  if (status === 'error' || !placement) {
    if (error?.status === 404) return <Panel><Empty title="Placement unavailable"><p>This posting is not currently published.</p><Link to="/student/discover" className="p-button">Discover placements</Link></Empty></Panel>
    return <Panel><Empty title="Placement could not be loaded"><p>{error ? apiErrorMessage(error.body, 'Something went wrong.') : 'Something went wrong.'}</p><button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></Empty></Panel>
  }
  const eligible = placement.eligibility.eligible
  const open = placement.status === 'Active'
  return <><div className="p-breadcrumb"><Link to="/student/discover">← Discover placements</Link><span>{placement.title}</span></div><div className="p-columns details"><Panel className="p-article"><div className="p-identity"><span className="p-company-mark">{placement.company[0]}</span><div><h2>{placement.title}</h2><p>{placement.company} {placement.companyVerified && <ShieldCheck className="p-inline-success" size={15} aria-label="Verified company" />}</p></div></div><div className="p-tags"><span><MapPin size={14} aria-hidden />{placement.location} · {placement.workStyle}</span><span><Clock3 size={14} aria-hidden />{placement.duration}</span><span><GraduationCap size={14} aria-hidden />{placement.discipline}</span></div><section><h3>About the role</h3><p>{placement.description}</p></section><section><h3>What you’ll do</h3><p>{placement.responsibilities}</p></section><section><h3>What we’re looking for</h3><p>{placement.requirements}</p><p>{placement.eligibility.required_discipline || placement.discipline} · {placement.eligibility.required_level} level and above</p></section><section><h3>Monthly stipend</h3><p>{placement.stipend || 'Not specified'}</p></section><div className="p-mobile-share"><CopyLink slug={placement.slug} title={placement.title} /></div></Panel><aside><Panel className="p-apply-panel"><Badge tone={eligible ? 'success' : 'warning'}>{eligible ? 'You’re eligible' : 'Eligibility requirements'}</Badge><h2>{placement.hasApplied ? 'Application submitted' : open ? 'Applications opening soon' : 'Applications closed'}</h2><p>Your Fixth profile and uploaded resume will be shared. No cover letter required.</p>{!user && <p className="p-callout">Sign in as a student to check your eligibility and apply. <Link to="/auth/student/sign-in" className="p-text-link">Sign in</Link></p>}{user && !eligible && <p className="p-callout warning">{placement.eligibility.reason} <Link to="/student/profile/edit">Review your academic details.</Link></p>}<button className="p-button" type="button" disabled title="One-click apply is coming soon">{placement.hasApplied ? 'Already applied' : !open ? 'Applications closed' : 'Apply with Fixth profile'}<ArrowRight size={16} aria-hidden /></button><p className="p-small">One-click apply will be enabled when student applications open. By applying, you agree to share your profile with this company.</p><hr /><h3>Share this placement</h3><p className="p-small">{window.location.host}/p/{placement.slug}</p><CopyLink slug={placement.slug} title={placement.title} /></Panel></aside></div></>
}

export function ApplicationsPage() {
  return <Panel><Empty title="Application tracking is coming soon"><p>The student applications API is not available yet. Once it ships, your submissions and their review statuses will appear here.</p><Link to="/student/discover" className="p-button">Discover placements</Link></Empty></Panel>
}
