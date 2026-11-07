import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Bookmark, MapPin, Clock3, GraduationCap, ArrowRight, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useApiData } from '@/hooks/useApiData'
import { useDebounced } from '@/hooks/useDebounced'
import { ApiError } from '@/services/http'
import { getPlacementById, getPlacementBySlug, getPlacementFacets, listPlacements, type StudentPlacement } from '@/services/placements'
import { listSavedPlacements, savePlacement, unsavePlacement } from '@/services/savedPlacements'
import { getPublicCompany, type PublicCompany } from '@/services/companies'
import { listDisciplines } from '@/services/reference'
import { apiErrorMessage } from '@/services/types'
import { Badge, Panel, Empty, Modal, CopyLink, Avatar, Tabs, Metrics } from './components/ui'
import { dateLabel } from './data'
import {
  getStudentApplication,
  getStudentApplicationSummary,
  listStudentApplicationEvents,
  listStudentApplications,
  submitStudentApplication,
  withdrawStudentApplication,
  type StudentApplication,
  type StudentApplicationEvent,
  type StudentApplicationSummary,
} from '@/services/studentApplications'
import { downloadDocument } from '@/services/documents'
import type { ApiApplicationStatus } from '@/services/types'

function PlacementCard({ placement, saving, signedIn, onToggleSave }: { placement: StudentPlacement; saving: boolean; signedIn: boolean; onToggleSave: (placement: StudentPlacement) => void }) {
  return <article className="p-placement-card"><div className="p-between"><div className="p-identity"><Avatar className="company-mark" src={placement.companyLogoUrl} fallback={placement.company[0]} /><div><h2><Link to={`/p/${placement.slug}`}>{placement.title}</Link></h2><p>{placement.company} {placement.companyVerified && <ShieldCheck aria-label="Verified company" size={14} className="p-inline-success" />}</p></div></div><button className="p-icon" type="button" disabled={!signedIn || saving} title={signedIn ? undefined : 'Sign in to save placements'} aria-label={`${placement.isSaved ? 'Remove from saved' : 'Save'} ${placement.title}`} aria-pressed={placement.isSaved} onClick={() => onToggleSave(placement)}><Bookmark size={18} aria-hidden fill={placement.isSaved ? 'currentColor' : 'none'} /></button></div><div className="p-tags"><span><MapPin aria-hidden size={13} />{placement.location} · {placement.workStyle}</span><span><Clock3 aria-hidden size={13} />{placement.duration}</span><span><GraduationCap aria-hidden size={13} />{placement.discipline}</span></div><div className="p-between p-card-foot"><span>Verified placement</span>{placement.match != null && <strong>{placement.match}% match</strong>}</div></article>
}

export function DiscoverPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const [params] = useSearchParams()
  const { user } = useAuth()
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
  const [facetState, setFacetState] = useState<{ locations: string[]; durations: string[] }>({ locations: [], durations: [] })
  const [saveNotice, setSaveNotice] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    getPlacementFacets()
      .then(facets => {
        if (live) setFacetState({ locations: facets.locations, durations: facets.durations })
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])

  const listParams = {
    q: debouncedQuery || undefined,
    discipline: discipline === 'All disciplines' ? undefined : discipline,
    location: location === 'All locations' ? undefined : location,
    duration: duration === 'Any duration' ? undefined : duration,
    workStyles,
    sort: (sort === 'Best match' ? 'match' : 'title') as 'match' | 'title',
  }
  const filterKey = [debouncedQuery, discipline, location, duration, workStyles.join(','), sort, savedOnly, attempt]

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    const request = savedOnly
      ? listSavedPlacements({ page: 1 }).then(savedList => ({
          ...savedList,
          results: savedList.results.map(entry => ({ ...entry.placement, isSaved: true as const })),
        }))
      : listPlacements({ ...listParams, page: 1 })
    request
      .then(result => {
        if (!live) return
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
    const request = savedOnly
      ? listSavedPlacements({ page: nextPage }).then(savedList => ({
          ...savedList,
          results: savedList.results.map(entry => ({ ...entry.placement, isSaved: true as const })),
        }))
      : listPlacements({ ...listParams, page: nextPage })
    request
      .then(result => {
        setItems(current => [...current, ...result.results])
        setHasMore(!!result.next)
        setPage(nextPage)
      })
      .catch(() => setError('More placements could not be loaded. Try again.'))
      .finally(() => setLoadingMore(false))
  }

  const toggleSave = async (placement: StudentPlacement) => {
    if (!user || savingId) return
    setSavingId(placement.id)
    try {
      if (placement.isSaved) {
        await unsavePlacement(placement.id)
        setSaveNotice(`${placement.title} removed from saved.`)
        if (savedOnly) {
          setItems(current => current.filter(item => item.id !== placement.id))
          setCount(value => Math.max(0, value - 1))
        } else {
          setItems(current => current.map(item => item.id === placement.id ? { ...item, isSaved: false } : item))
        }
      } else {
        await savePlacement(placement.id)
        setSaveNotice(`${placement.title} saved.`)
        setItems(current => current.map(item => item.id === placement.id ? { ...item, isSaved: true } : item))
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setSaveNotice(`${placement.title} was already saved.`)
        setItems(current => current.map(item => item.id === placement.id ? { ...item, isSaved: true } : item))
      } else {
        setSaveNotice(
          caught instanceof ApiError
            ? caught.status === 429
              ? 'Too many requests. Please wait a moment and try again.'
              : apiErrorMessage(caught.body, 'The placement could not be saved.')
            : 'Could not reach the server. Check your connection and try again.',
        )
      }
    } finally {
      setSavingId(null)
    }
  }

  const disciplines = useApiData(() => listDisciplines(), [])
  const disciplineOptions = ['All disciplines', ...new Set([...(disciplines.data?.map(d => d.name) ?? []), ...items.map(p => p.discipline)])]
  const locationOptions = ['All locations', ...facetState.locations]
  const durationOptions = ['Any duration', ...facetState.durations]

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
    {saveNotice && <p className="p-small" role="status">{saveNotice}</p>}
    {error && <Panel><Empty title="Placements could not be loaded"><p>{error}</p><button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></Empty></Panel>}
    {!error && <div className="p-stack">{loading ? <Panel><p role="status">Loading placements…</p></Panel> : items.length ? <>{items.map(p => <PlacementCard key={p.id} placement={p} saving={savingId === p.id} signedIn={Boolean(user)} onToggleSave={toggleSave} />)}{hasMore && <button type="button" className="p-button secondary" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading…' : 'Load more placements'}</button>}</> : <Panel><Empty title={savedOnly ? 'No saved placements yet' : 'No matching placements'}><p>{savedOnly ? 'Use the bookmark button on a placement to save it for later. Closed listings stay in this list with their current status.' : 'Try a different role, location, or discipline.'}</p>{!savedOnly && <Link className="p-button" to="/student/discover">Discover placements</Link>}</Empty></Panel>}</div>}
  </div><aside className="p-stack p-secondary-rail"><Panel><div className="p-between"><h2>Application profile</h2><Badge>One-click apply</Badge></div><p>Your Fixth profile and resume are used for one-click applications. Applications open soon.</p><Link className="p-file" to="/student/resume"><FileText size={20} aria-hidden /><span>Manage your resume<small>Resume preferences →</small></span></Link></Panel><Panel className="tinted"><p className="p-eyebrow">Placement alerts</p><h2>Get notified first</h2><p>Verified roles are matched to your discipline. Keep your profile preferences up to date.</p><Link to="/student/profile/edit" className="p-text-link">Update preferences →</Link></Panel></aside>
  {filtersOpen && <Modal title="Filter placements" onClose={() => setFiltersOpen(false)}><div className="p-form">{controls}<button type="button" className="p-button" onClick={() => { setDiscipline('All disciplines'); setLocation('All locations'); setDuration('Any duration'); setWorkStyles([]) }}>Reset filters</button><button type="button" className="p-button" onClick={() => setFiltersOpen(false)}>Show {count} placements</button></div></Modal>}
  </div>
}

export function CompanyPanel({ slug }: { slug: string }) {
  const { status, data: company } = useApiData<PublicCompany>(() => getPublicCompany(slug), [slug])
  if (status === 'loading') return <Panel><p className="p-small" role="status">Loading company…</p></Panel>
  if (status === 'error' || !company) return null
  const website = company.website.replace(/^https?:\/\//, '')
  return (
    <Panel>
      <div className="p-identity">
        <Avatar className="company-mark" src={company.logoUrl} fallback={company.name[0]} />
        <div>
          <h2>{company.name} {company.verificationStatus === 'Verified' && <ShieldCheck className="p-inline-success" size={15} aria-label="Verified company" />}</h2>
          <p>{company.industry} · {company.city}, {company.country}</p>
        </div>
      </div>
      <p>{company.description}</p>
      {company.website && <p><a href={`https://${website}`} rel="noreferrer noopener" target="_blank" className="p-text-link">{website}</a></p>}
    </Panel>
  )
}

export function PlacementDetailPage() {
  const { slug, id } = useParams()
  const { user } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const { status, data: placement, error } = useApiData(
    () => (slug ? getPlacementBySlug(slug) : getPlacementById(id!)),
    [slug, id, attempt],
  )
  const [applyBusy, setApplyBusy] = useState(false)
  const [justApplied, setJustApplied] = useState(false)
  const [applyError, setApplyError] = useState('')
  const hasApplied = justApplied || Boolean(placement?.hasApplied)

  const apply = async () => {
    if (!placement || applyBusy) return
    setApplyBusy(true)
    setApplyError('')
    try {
      await submitStudentApplication({ placementId: placement.id })
      setJustApplied(true)
    } catch (caught) {
      if (caught instanceof ApiError) {
        setJustApplied(caught.status === 409)
        setApplyError(
          caught.status === 409
            ? 'You have already applied to this placement.'
            : apiErrorMessage(caught.body, 'Your application could not be submitted.'),
        )
      } else {
        setApplyError('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setApplyBusy(false)
    }
  }
  if (status === 'loading') return <Panel><p role="status">Loading placement…</p></Panel>
  if (status === 'error' || !placement) {
    if (error?.status === 404) return <Panel><Empty title="Placement unavailable"><p>This posting is not currently published.</p><Link to="/student/discover" className="p-button">Discover placements</Link></Empty></Panel>
    return <Panel><Empty title="Placement could not be loaded"><p>{error ? apiErrorMessage(error.body, 'Something went wrong.') : 'Something went wrong.'}</p><button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></Empty></Panel>
  }
  const eligible = placement.eligibility.eligible
  const open = placement.status === 'Active'
  return <><div className="p-breadcrumb"><Link to="/student/discover">← Discover placements</Link><span>{placement.title}</span></div><div className="p-columns details"><Panel className="p-article"><div className="p-identity"><Avatar className="company-mark" src={placement.companyLogoUrl} fallback={placement.company[0]} /><div><h2>{placement.title}</h2><p>{placement.company} {placement.companyVerified && <ShieldCheck className="p-inline-success" size={15} aria-label="Verified company" />}</p></div></div><div className="p-tags"><span><MapPin size={14} aria-hidden />{placement.location} · {placement.workStyle}</span><span><Clock3 size={14} aria-hidden />{placement.duration}</span><span><GraduationCap size={14} aria-hidden />{placement.discipline}</span></div><section><h3>About the role</h3><p>{placement.description}</p></section><section><h3>What you’ll do</h3><p>{placement.responsibilities}</p></section><section><h3>What we’re looking for</h3><p>{placement.requirements}</p><p>{placement.eligibility.required_discipline || placement.discipline} · {placement.eligibility.required_level} level and above</p></section><section><h3>Monthly stipend</h3><p>{placement.stipend || 'Not specified'}</p></section><div className="p-mobile-share"><CopyLink slug={placement.slug} title={placement.title} /></div></Panel><aside><CompanyPanel slug={placement.companySlug} /><Panel className="p-apply-panel"><Badge tone={eligible ? 'success' : 'warning'}>{eligible ? 'You’re eligible' : 'Eligibility requirements'}</Badge><h2>{hasApplied ? 'Application submitted' : open ? (placement.canApply ? 'Applications open' : 'Application requirements') : 'Applications closed'}</h2><p>Your Fixth profile and uploaded resume will be shared. No cover letter required.</p>{!user && <p className="p-callout">Sign in as a student to check your eligibility and apply. <Link to="/auth/student/sign-in" className="p-text-link">Sign in</Link></p>}{user && !eligible && <p className="p-callout warning">{placement.eligibility.reason} <Link to="/student/profile/edit">Review your academic details.</Link></p>}{applyError && <p role="alert" className="p-error">{applyError}</p>}{justApplied && <p className="p-callout">Application submitted. <Link to="/student/applications" className="p-text-link">Track it in your applications</Link></p>}<button className="p-button" type="button" disabled={!user || !placement.canApply || !open || hasApplied || applyBusy} onClick={apply}>{hasApplied ? 'Already applied' : !open ? 'Applications closed' : applyBusy ? 'Submitting.' : 'Apply with Fixth profile'}<ArrowRight size={16} aria-hidden /></button><p className="p-small">{hasApplied ? 'Your application is in. Track review updates in your applications.' : user ? 'By applying, you agree to share your profile and resume with this company.' : 'One-click apply uses your Fixth profile and resume.'}</p><hr /><h3>Share this placement</h3><p className="p-small">{window.location.host}/p/{placement.slug}</p><CopyLink slug={placement.slug} title={placement.title} /></Panel></aside></div></>
}

const APPLICATION_STATUSES = ['All', 'Submitted', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected', 'Withdrawn']
/** The backend only allows withdrawal from these application statuses. */
const WITHDRAWABLE_STATUSES: ApiApplicationStatus[] = ['Submitted', 'Viewed', 'Shortlisted']

function applicationStatusTone(status: ApiApplicationStatus) {
  if (status === 'Accepted' || status === 'Shortlisted') return 'success' as const
  if (status === 'Rejected') return 'danger' as const
  return 'neutral' as const
}

function eventHeadline(event: StudentApplicationEvent) {
  if (event.toStatus === 'Submitted') return 'Application submitted'
  if (event.toStatus === 'Withdrawn') return 'Application withdrawn'
  return event.fromStatus ? `Status updated: ${event.fromStatus} → ${event.toStatus}` : event.toStatus
}

function WithdrawModal({ application, onClose, onWithdrawn }: { application: StudentApplication; onClose: () => void; onWithdrawn: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const withdraw = async () => {
    setBusy(true)
    setError('')
    try {
      await withdrawStudentApplication(application.id)
      setBusy(false)
      onClose()
      onWithdrawn()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(
          caught.status === 409
            ? 'This application can no longer be withdrawn.'
            : apiErrorMessage(caught.body, 'The application could not be withdrawn.'),
        )
      } else {
        setError('Could not reach the server. Try again.')
      }
      setBusy(false)
    }
  }
  return (
    <Modal title="Withdraw this application?" onClose={() => !busy && onClose()}>
      <p>
        <strong>{application.placement.title}</strong> at {application.placement.company} will be
        removed from your applications. The company will no longer see you as an applicant.
      </p>
      {error && <p role="alert" className="p-error">{error}</p>}
      <div className="p-actions">
        <button type="button" className="p-button secondary" disabled={busy} onClick={onClose}>
          Keep application
        </button>
        <button type="button" className="p-button" disabled={busy} onClick={withdraw}>
          {busy ? 'Withdrawing…' : 'Withdraw application'}
        </button>
      </div>
    </Modal>
  )
}

function ApplicationCard({ application, onWithdraw }: { application: StudentApplication; onWithdraw: (application: StudentApplication) => void }) {
  const withdrawable = WITHDRAWABLE_STATUSES.includes(application.status)
  const placement = application.placement
  return (
    <article className="p-placement-card">
      <div className="p-between">
        <div className="p-identity">
          <Avatar className="company-mark" src={placement.companyLogoUrl} fallback={placement.company[0]} />
          <div>
            <h2><Link to={`/student/applications/${application.id}`}>{placement.title}</Link></h2>
            <p>{placement.company} {placement.companyVerified && <ShieldCheck aria-label="Verified company" size={14} className="p-inline-success" />}</p>
          </div>
        </div>
        <Badge tone={applicationStatusTone(application.status)}>{application.status}</Badge>
      </div>
      <div className="p-tags">
        <span><MapPin aria-hidden size={13} />{placement.location} · {placement.workStyle}</span>
        <span><Clock3 aria-hidden size={13} />Applied {dateLabel(application.appliedAt)}</span>
      </div>
      <div className="p-between p-card-foot">
        <Link to={`/student/applications/${application.id}`} className="p-text-link">View details</Link>
        {withdrawable && (
          <button type="button" className="p-danger-link" onClick={() => onWithdraw(application)}>
            Withdraw<span className="p-sr"> {placement.title}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [items, setItems] = useState<StudentApplication[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [summary, setSummary] = useState<StudentApplicationSummary | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<StudentApplication | null>(null)

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    const listParams = { status: statusFilter }
    listStudentApplications({ ...listParams, page: 1 })
      .then(result => {
        if (!live) return
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
              : apiErrorMessage(err.body, 'Applications could not be loaded.')
            : 'Could not reach the server. Check your connection and try again.',
        )
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    getStudentApplicationSummary()
      .then(result => {
        if (live) setSummary(result)
      })
      .catch(() => {
        if (live) setSummary(null)
      })
    return () => {
      live = false
    }
  }, [statusFilter, attempt])

  const loadMore = () => {
    const nextPage = page + 1
    setLoadingMore(true)
    listStudentApplications({ status: statusFilter, page: nextPage })
      .then(result => {
        setItems(current => [...current, ...result.results])
        setHasMore(!!result.next)
        setPage(nextPage)
      })
      .catch(() => setError('More applications could not be loaded. Try again.'))
      .finally(() => setLoadingMore(false))
  }

  const refresh = () => setAttempt(value => value + 1)

  return (
    <>
      <div className="p-between p-section-head">
        <div>
          <h2>Your applications</h2>
          <p>Track what you have applied to and where each one stands.</p>
        </div>
      </div>
      <Metrics
        items={[
          ['Total', summary?.total ?? 0],
          ['Pending', summary?.pending ?? 0],
          ['Under review', summary?.underReview ?? 0],
          ['Shortlisted', summary?.shortlisted ?? 0],
          ['Accepted', summary?.accepted ?? 0],
          ['Rejected', summary?.rejected ?? 0],
          ['Withdrawn', summary?.withdrawn ?? 0],
        ]}
      />
      {error && !loading ? (
        <Panel>
          <Empty title="Applications could not be loaded"><p>{error}</p><button type="button" className="p-button" onClick={refresh}>Try again</button></Empty>
        </Panel>
      ) : (
        <>
          <Tabs items={APPLICATION_STATUSES} value={statusFilter} onChange={setStatusFilter} label="Filter applications by status" />
          {loading ? (
            <Panel><p role="status">Loading applications…</p></Panel>
          ) : items.length ? (
            <>
              <p className="p-result-count" role="status">{loading ? '' : `${count} application${count === 1 ? '' : 's'}`}</p>
              <div className="p-stack">{items.map(application => <ApplicationCard key={application.id} application={application} onWithdraw={setWithdrawTarget} />)}</div>
              {hasMore && (
                <button type="button" className="p-button secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : 'Load more applications'}
                </button>
              )}
            </>
          ) : (
            <Panel>
              <Empty title={statusFilter === 'All' ? 'No applications yet' : `No ${statusFilter.toLowerCase()} applications`}>
                <p>When you apply with your Fixth profile, your submissions appear here with their review status.</p>
                <Link to="/student/discover" className="p-button">Discover placements</Link>
              </Empty>
            </Panel>
          )}
        </>
      )}
      {withdrawTarget && (
        <WithdrawModal
          application={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onWithdrawn={refresh}
        />
      )}
    </>
  )
}

export function ApplicationDetailPage() {
  const { id } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const { status, data: application, error } = useApiData(async () => {
    const [detail, events] = await Promise.all([
      getStudentApplication(id!),
      listStudentApplicationEvents(id!),
    ])
    return { ...detail, events }
  }, [id, attempt])
  if (status === 'loading') return <Panel><p role="status">Loading application…</p></Panel>
  if (status === 'error' || !application) {
    if (error?.status === 404) return <Panel><Empty title="Application not found"><p>This application is no longer available. It may have been removed.</p><Link to="/student/applications" className="p-button">Back to applications</Link></Empty></Panel>
    if (error?.status === 403) return <Panel><Empty title="Application unavailable"><p>You can only view applications submitted by your own account.</p><Link to="/student/applications" className="p-button">Back to applications</Link></Empty></Panel>
    return <Panel><Empty title="Application could not be loaded"><p>{error ? apiErrorMessage(error.body, 'Something went wrong.') : 'Something went wrong.'}</p><button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></Empty></Panel>
  }
  const placement = application.placement
  const withdrawable = WITHDRAWABLE_STATUSES.includes(application.status)
  const downloadResume = async () => {
    if (!application.resume || downloading) return
    setDownloading(true)
    setDownloadError('')
    try {
      await downloadDocument(application.resume)
    } catch (caught) {
      setDownloadError(
        caught instanceof ApiError
          ? apiErrorMessage(caught.body, 'The resume could not be downloaded.')
          : 'Could not reach the server. Try again.',
      )
    } finally {
      setDownloading(false)
    }
  }
  return (
    <>
      <div className="p-breadcrumb"><Link to="/student/applications">← Applications</Link><span>{placement.title}</span></div>
      <div className="p-columns details">
        <Panel className="p-article">
          <div className="p-identity">
            <Avatar className="company-mark" src={placement.companyLogoUrl} fallback={placement.company[0]} />
            <div>
              <h2><Link to={`/p/${placement.slug}`}>{placement.title}</Link></h2>
              <p>{placement.company} {placement.companyVerified && <ShieldCheck className="p-inline-success" size={15} aria-label="Verified company" />}</p>
            </div>
          </div>
          <div className="p-tags">
            <span><MapPin size={14} aria-hidden />{placement.location} · {placement.workStyle}</span>
            <span><Clock3 size={14} aria-hidden />{placement.duration}</span>
            <span><GraduationCap size={14} aria-hidden />{placement.discipline}</span>
          </div>
          <section>
            <h3>About the role</h3>
            <p>{placement.description}</p>
          </section>
          <section>
            <h3>Monthly stipend</h3>
            <p>{placement.stipend || 'Not specified'}</p>
          </section>
          <section>
            <h3>What we're looking for</h3>
            <p>{placement.requirements}</p>
          </section>
          {application.coverNote && (
            <section>
              <h3>Cover note</h3>
              <p>{application.coverNote}</p>
            </section>
          )}
        </Panel>
        <aside className="p-stack">
          <Panel>
            <div className="p-between">
              <h2>Application status</h2>
              <Badge tone={applicationStatusTone(application.status)}>{application.status}</Badge>
            </div>
            {application.status === 'Rejected' && application.rejectionReason && <p>{application.rejectionReason}</p>}
            <dl className="p-definition">
              <div><dt>Applied</dt><dd>{dateLabel(application.appliedAt)}</dd></div>
              <div><dt>Last update</dt><dd>{application.statusChangedAt ? dateLabel(application.statusChangedAt) : 'Not yet reviewed'}</dd></div>
              {application.decidedByEmail && <div><dt>Reviewed by</dt><dd>{application.decidedByEmail}</dd></div>}
            </dl>
            <Link to={`/p/${placement.slug}`} className="p-text-link">View the placement</Link>
          </Panel>
          <Panel className="tinted">
            <p className="p-eyebrow">Active resume</p>
            {application.resume ? (
              <div className="p-file">
                <FileText aria-hidden size={26} />
                <div className="p-grow">
                  <strong>{application.resume.original_name}</strong>
                  <small>{(application.resume.size / 1024).toFixed(0)} KB · {application.resume.mime_type}</small>
                </div>
              </div>
            ) : (
              <h2>No resume attached</h2>
            )}
            {downloadError && <p role="alert" className="p-error">{downloadError}</p>}
            {application.resume && (
              <button type="button" className="p-button secondary" disabled={downloading} onClick={downloadResume}>
                {downloading ? 'Downloading…' : 'Download resume'}
              </button>
            )}
            <p className="p-small">This resume was shared with the company when you applied.</p>
          </Panel>
          <Panel>
            <h3>Application timeline</h3>
            <ul className="p-checklist">
              {application.events.map(event => (
                <li key={event.id}>
                  <div>
                    <strong>{eventHeadline(event)}</strong>
                    <p className="p-small">
                      {dateLabel(event.createdAt)}
                      {event.actorEmail ? ` · ${event.actorEmail}` : ''}
                    </p>
                    {event.reason && <p className="p-small">{event.reason}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          {withdrawable && (
            <Panel>
              <h3>Change your mind?</h3>
              <p className="p-small">You can withdraw this application while the company has not made a final decision.</p>
              <button type="button" className="p-danger-link" onClick={() => setWithdrawOpen(true)}>Withdraw application</button>
            </Panel>
          )}
        </aside>
      </div>
      {withdrawOpen && (
        <WithdrawModal
          application={application}
          onClose={() => setWithdrawOpen(false)}
          onWithdrawn={() => setAttempt(value => value + 1)}
        />
      )}
    </>
  )
}
