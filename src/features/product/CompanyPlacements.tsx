import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Building2, Clock3, GraduationCap, MapPin, Pencil, Plus, Users } from 'lucide-react'
import { useDebounced } from '@/hooks/useDebounced'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'
import {
  createCompanyPlacement,
  getCompanyPlacement,
  listCompanyPlacements,
  publishCompanyPlacement,
  updateCompanyPlacement,
  type CompanyPlacementInput,
  type StudentPlacement,
} from '@/services/placements'
import { getCompanySummary } from '@/services/companies'
import { Badge, CopyLink, Empty, Metrics, Modal, Panel, Tabs } from './components/ui'
import { Field, ValidatedForm } from './components/Form'
import { dateLabel } from './data'
import Combobox from '@/components/common/Combobox'
import CharCount from '@/components/common/CharCount'
import { ENGINEERING_DISCIPLINES, MULTI_DISCIPLINE, decodeDisciplines, disciplineLabel, encodeDisciplines } from '@/lib/disciplines'
import { LIMITS, lengthError } from '@/lib/limits'

const PAGE_SIZE = 20

interface CompanyMetrics {
  active: number
  draft: number
  applicants: number
  shortlisted: number
  hired: number
}

const blankMetrics: CompanyMetrics = {
  active: 0,
  draft: 0,
  applicants: 0,
  shortlisted: 0,
  hired: 0,
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Your organization cannot access company tools yet. Complete onboarding or contact Fixth support.'
    }
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.'
    return apiErrorMessage(error.body, fallback)
  }
  return 'Could not reach the server. Check your connection and try again.'
}

export function CompanyPlacementsPage() {
  const location = useLocation()
  const navState = location.state as { saved?: string; closed?: boolean } | null
  const savedNotice = navState?.saved
  const [notice, setNotice] = useState(
    savedNotice
      ? navState?.closed
        ? `${savedNotice} is now closed and no longer accepting applications.`
        : `${savedNotice} was saved.`
      : '',
  )
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')
  const debouncedQuery = useDebounced(query, 300)
  const [items, setItems] = useState<StudentPlacement[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [moreError, setMoreError] = useState('')
  const generation = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [metrics, setMetrics] = useState<CompanyMetrics>(blankMetrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [closing, setClosing] = useState<StudentPlacement | null>(null)
  const [closeBusy, setCloseBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let live = true
    setMetricsLoading(true)
    Promise.all([getCompanySummary(), listCompanyPlacements({ status: 'Draft', pageSize: 1 })])
      .then(([summary, draft]) => {
        if (!live) return
        setMetrics({
          active: summary.activePlacements,
          draft: draft.count,
          applicants: summary.applicants,
          shortlisted: summary.shortlisted,
          hired: summary.hired,
        })
      })
      .catch(() => {
        // The table below surfaces the actionable error if the session/company is invalid.
      })
      .finally(() => {
        if (live) setMetricsLoading(false)
      })
    return () => {
      live = false
    }
  }, [refreshKey])

  useEffect(() => {
    let live = true
    generation.current += 1
    setLoading(true)
    setError('')
    setMoreError('')
    setLoadingMore(false)
    listCompanyPlacements({
      status: tab,
      q: debouncedQuery || undefined,
      sort,
      page: 1,
      pageSize: PAGE_SIZE,
    })
      .then(result => {
        if (!live) return
        setItems(result.results)
        setCount(result.count)
        setHasMore(!!result.next)
        setPage(1)
      })
      .catch(err => {
        if (!live) return
        setItems([])
        setCount(0)
        setHasMore(false)
        setError(errorText(err, 'Placements could not be loaded.'))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedQuery, sort, attempt, refreshKey])

  const loadMore = () => {
    const nextPage = page + 1
    const requestGeneration = generation.current
    setLoadingMore(true)
    setMoreError('')
    listCompanyPlacements({
      status: tab,
      q: debouncedQuery || undefined,
      sort,
      page: nextPage,
      pageSize: PAGE_SIZE,
    })
      .then(result => {
        if (requestGeneration !== generation.current) return
        setItems(current => [...current, ...result.results])
        setHasMore(!!result.next)
        setPage(nextPage)
        setCount(result.count)
      })
      .catch(() => {
        if (requestGeneration === generation.current) setMoreError('More placements could not be loaded. Try again.')
      })
      .finally(() => {
        if (requestGeneration === generation.current) setLoadingMore(false)
      })
  }

  const refresh = () => {
    setRefreshKey(key => key + 1)
  }

  const closePlacement = () => {
    if (!closing) return
    setCloseBusy(true)
    setActionError('')
    updateCompanyPlacement(closing.id, { status: 'Closed' })
      .then(result => {
        setNotice(`${result.title} is now closed and no longer accepting applications.`)
        setClosing(null)
        refresh()
      })
      .catch(err => setActionError(errorText(err, 'The placement could not be closed.')))
      .finally(() => setCloseBusy(false))
  }

  const tabCount = tab === 'All' ? metrics.active + metrics.draft : undefined

  return (
    <>
      <Metrics
        items={[
          ['Active', metricsLoading ? '…' : metrics.active],
          ['Applicants', metricsLoading ? '…' : metrics.applicants],
          ['Shortlisted', metricsLoading ? '…' : metrics.shortlisted],
          ['Hired', metricsLoading ? '…' : metrics.hired],
        ]}
      />
      <div className="p-between p-section-head">
        <div>
          <h2>Placement listings</h2>
          <p>Active, closed, and draft opportunities</p>
        </div>
        <Link to="/company/placements/new" className="p-button">
          <Plus size={16} aria-hidden />
          Create placement
        </Link>
      </div>
      {notice && (
        <div role="status" className="p-panel tinted">
          <p>{notice}</p>
        </div>
      )}
      <Tabs
        items={['All', 'Active', 'Draft', 'Closed', 'Expired']}
        value={tab}
        onChange={value => {
          setTab(value)
          setNotice('')
        }}
        label="Placement status"
      />
      <div className="p-toolbar">
        <label className="p-search">
          <span className="p-sr">Search placements</span>
          <input
            type="search"
            value={query}
            placeholder="Search placements by title"
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <div className="p-between p-result-count">
          <p role="status">
            {loading
              ? 'Loading placements…'
              : `${count} placement${count === 1 ? '' : 's'}${tab === 'All' ? '' : ` · ${tab}`}`}
          </p>
          <label>
            <span className="p-sr">Sort placements</span>
            <select
              value={sort}
              onChange={event => setSort(event.target.value as typeof sort)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
      </div>
      {actionError && (
        <div role="alert" className="p-panel">
          <p className="p-error">{actionError}</p>
        </div>
      )}
      {error && (
        <Panel>
          <Empty title="Placements could not be loaded">
            <p>{error}</p>
            <button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>
              Try again
            </button>
          </Empty>
        </Panel>
      )}
      {!error && (
        <Panel>
          {loading ? (
            <p role="status">Loading placements…</p>
          ) : items.length ? (
            <>
              <ul className="p-listing-cards">
                {items.map(placement => (
                  <li key={placement.id} className="p-listing-card">
                    <div className="p-listing-main">
                      <div className="p-listing-title">
                        <h3>
                          <Link to={`/company/placements/${placement.id}`}>{placement.title}</Link>
                        </h3>
                        <Badge>{placement.status}</Badge>
                      </div>
                      <p className="p-listing-sub">
                        {disciplineLabel(placement.discipline) || 'Discipline not set'}
                        <span aria-hidden> · </span>
                        Created {dateLabel(placement.createdAt)}
                      </p>
                      <ul className="p-listing-meta" aria-label="Placement details">
                        <li><MapPin aria-hidden size={13} />{placement.location || 'Location not set'}</li>
                        <li><Building2 aria-hidden size={13} />{placement.workStyle}</li>
                        <li><Clock3 aria-hidden size={13} />{placement.duration || 'Duration not set'}</li>
                        <li><GraduationCap aria-hidden size={13} />{placement.level}L+</li>
                      </ul>
                    </div>
                    <div className="p-listing-actions">
                      <Link
                        to={`/company/placements/${placement.id}/applicants`}
                        state={{ from: '/company/placements' }}
                        className="p-button subtle"
                      >
                        <Users aria-hidden size={14} />
                        Applicants
                      </Link>
                      <Link to={`/company/placements/${placement.id}/edit`} className="p-button secondary">
                        <Pencil aria-hidden size={14} />
                        Edit
                      </Link>
                      {placement.status === 'Active' && (
                        <>
                          <CopyLink slug={placement.slug} title={placement.title} />
                          <button
                            type="button"
                            className="p-button secondary"
                            onClick={() => {
                              setActionError('')
                              setClosing(placement)
                            }}
                          >
                            Close<span className="p-sr"> {placement.title}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {moreError && <p role="alert" className="p-error">{moreError}</p>}
              {hasMore && (
                <button
                  type="button"
                  className="p-button secondary"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? 'Loading…' : moreError ? 'Try loading more again' : 'Load more placements'}
                </button>
              )}
            </>
          ) : (
            <Empty title={query ? 'No matching placements' : 'No placements in this category'}>
              <p>
                {query
                  ? 'Try a different search term or status filter.'
                  : tab === 'All'
                    ? 'Create your first placement to start receiving applications.'
                    : 'Placements with this status will appear here.'}
              </p>
              {tab === 'All' && (
                <Link to="/company/placements/new" className="p-button">
                  Create placement
                </Link>
              )}
            </Empty>
          )}
        </Panel>
      )}
      {closing && (
        <Modal title="Close this placement?" onClose={() => !closeBusy && setClosing(null)}>
          <p>
            <strong>{closing.title}</strong> will stop accepting new applications. Existing
            applicants remain available.
          </p>
          <div className="p-actions">
            <button
              type="button"
              className="p-button secondary"
              disabled={closeBusy}
              onClick={() => setClosing(null)}
            >
              Keep open
            </button>
            <button type="button" className="p-button" disabled={closeBusy} onClick={closePlacement}>
              {closeBusy ? 'Closing…' : 'Close placement'}
            </button>
          </div>
        </Modal>
      )}
      {tabCount !== undefined && tab === 'All' && !loading && !error && (
        <p className="p-small">
          {tabCount} open and draft listing{tabCount === 1 ? '' : 's'}.
        </p>
      )}
    </>
  )
}

const blankForm: CompanyPlacementInput = {
  title: '',
  location: '',
  workStyle: 'Hybrid',
  duration: '6 months',
  discipline: '',
  level: 300,
  stipendAmount: '',
  currency: 'NGN',
  description: '',
  responsibilities: '',
  requirements: '',
  status: 'Draft',
}

const API_FIELD_NAMES: Record<string, keyof CompanyPlacementInput> = {
  title: 'title',
  location: 'location',
  work_style: 'workStyle',
  duration: 'duration',
  discipline: 'discipline',
  level: 'level',
  stipend_amount: 'stipendAmount',
  currency: 'currency',
  description: 'description',
  responsibilities: 'responsibilities',
  requirements: 'requirements',
  status: 'status',
}

function fieldErrorsFrom(body: unknown): Record<string, string> {
  const result: Record<string, string> = {}
  if (!body || typeof body !== 'object') return result
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const mapped = API_FIELD_NAMES[key]
    if (!mapped) continue
    result[mapped] = Array.isArray(value) ? String(value[0]) : String(value)
  }
  return result
}

/** Keyed by placement so switching between editors never mixes form state. */
export function PlacementEditorPage() {
  const { id } = useParams()
  return <PlacementEditor key={id ?? 'new'} id={id} />
}

function PlacementEditor({ id }: { id?: string }) {
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [form, setForm] = useState<CompanyPlacementInput>(blankForm)
  const [serverStatus, setServerStatus] = useState<StudentPlacement['status']>('Draft')
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (!id) return
    let live = true
    getCompanyPlacement(id)
      .then(placement => {
        if (!live) return
        setForm({
          title: placement.title,
          location: placement.location,
          workStyle: placement.workStyle,
          duration: placement.duration,
          discipline: placement.discipline,
          level: placement.level,
          stipendAmount: placement.stipendAmount ?? '',
          currency: placement.currency || 'NGN',
          description: placement.description,
          responsibilities: placement.responsibilities,
          requirements: placement.requirements,
          status:
            placement.status === 'Draft' ||
            placement.status === 'Active' ||
            placement.status === 'Closed'
              ? placement.status
              : undefined,
        })
        setServerStatus(placement.status)
      })
      .catch(err => {
        if (!live) return
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setLoadError(errorText(err, 'The placement could not be loaded.'))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [id])

  const update = (key: keyof CompanyPlacementInput, value: string | number) => {
    setForm(current => ({ ...current, [key]: value }))
    setFieldErrors(current => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setMessage('')
  }

  const validate = (publish: boolean) => {
    const errors: Record<string, string> = {}
    if (!form.title.trim()) errors.title = 'Enter a role title.'
    if (form.discipline && !form.discipline.trim()) errors.discipline = 'Choose an eligible discipline.'
    if (publish) {
      if (!form.location.trim()) errors.location = 'Enter a location.'
      if (!form.duration.trim()) errors.duration = 'Enter a duration.'
      if (!form.discipline.trim()) errors.discipline = 'Choose an eligible discipline.'
      if (!form.description.trim()) errors.description = 'Add a description.'
      if (!form.responsibilities.trim()) errors.responsibilities = 'Add responsibilities.'
      if (!form.requirements.trim()) errors.requirements = 'Add requirements.'
      const stipend = Number(form.stipendAmount)
      if (form.stipendAmount.trim() && (!Number.isFinite(stipend) || stipend < 0)) {
        errors.stipendAmount = stipend < 0 ? 'Stipend cannot be negative.' : 'Enter a valid stipend amount.'
      }
    } else if (form.stipendAmount.trim()) {
      const stipend = Number(form.stipendAmount)
      if (!Number.isFinite(stipend) || stipend < 0) {
        errors.stipendAmount = 'Stipend cannot be negative.'
      }
    }
    // Length limits apply to drafts too: the API rejects over-long text.
    const lengths: [keyof CompanyPlacementInput, number][] = [
      ['title', LIMITS.placementTitle],
      ['location', LIMITS.placementLocation],
      ['duration', LIMITS.placementDuration],
      ['discipline', LIMITS.discipline],
    ]
    for (const [key, max] of lengths) {
      const tooLong = lengthError(String(form[key] ?? ''), max)
      if (tooLong && !errors[key]) errors[key] = tooLong
    }
    setFieldErrors(errors)
    return !Object.keys(errors).length
  }

  const save = async (target?: 'Draft' | 'Active' | 'Closed') => {
    // A live listing must stay complete, so edits to an Active placement use
    // the same rules as publishing.
    const publish = target === 'Active' || (editing && serverStatus === 'Active' && target !== 'Closed')
    if (!validate(publish)) {
      setMessage('Review the highlighted fields and try again.')
      return
    }
    setBusy(target || 'save')
    setMessage('')
    const payload: CompanyPlacementInput = {
      ...form,
      title: form.title.trim(),
      discipline: form.discipline.trim(),
      location: form.location.trim(),
      duration: form.duration.trim(),
      ...(target ? { status: target } : {}),
    }
    try {
      let result: StudentPlacement
      if (editing && id) {
        // Save edits first, then use the dedicated publish endpoint when the
        // action is a publish (it transitions Draft/Closed → Active). Closing
        // is a plain status PATCH, the same call the listings table uses.
        const { status: _status, ...editable } = payload
        result = await updateCompanyPlacement(
          id,
          target === 'Closed' ? { ...editable, status: 'Closed' } : editable,
        )
        if (target === 'Active') result = await publishCompanyPlacement(id)
      } else {
        result = await createCompanyPlacement({ ...payload, status: target || 'Draft' })
      }
      navigate('/company/placements', {
        state: { saved: result.title, closed: target === 'Closed' && result.status === 'Closed' },
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const mapped = fieldErrorsFrom(error.body)
        setFieldErrors(mapped)
        setMessage(
          Object.keys(mapped).length
            ? 'Some details need attention. Review the highlighted fields.'
            : apiErrorMessage(error.body, 'The placement could not be saved.'),
        )
      } else if (error instanceof ApiError && error.status === 409) {
        setMessage(apiErrorMessage(error.body, 'That status change is not allowed.'))
      } else {
        setMessage(errorText(error, 'The placement could not be saved.'))
      }
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <Panel><p role="status">Loading placement…</p></Panel>
  if (notFound) {
    return (
      <Panel>
        <Empty title="Placement not found">
          <p>It may have been removed, or it belongs to another organization.</p>
          <Link to="/company/placements" className="p-button">
            Back to listings
          </Link>
        </Empty>
      </Panel>
    )
  }
  if (loadError) {
    return (
      <Panel>
        <Empty title="Placement could not be loaded">
          <p>{loadError}</p>
          <Link to="/company/placements" className="p-button">
            Back to listings
          </Link>
        </Empty>
      </Panel>
    )
  }

  const canSaveDraft = !editing || serverStatus === 'Draft'
  const canPublish = !editing || serverStatus === 'Draft' || serverStatus === 'Closed'
  const canClose = editing && serverStatus === 'Active'
  const requireComplete = canPublish || serverStatus === 'Active'
  const primaryTarget: 'Active' | undefined = canPublish ? 'Active' : undefined
  const primaryLabel = canPublish ? (serverStatus === 'Closed' ? 'Reopen placement' : 'Publish placement') : 'Save changes'

  return (
    <>
      <Link to="/company/placements" className="p-text-link">
        ← Back to placements
      </Link>
      <div className="p-columns">
      <Panel>
        <div className="p-between">
          <h2>{editing ? 'Edit placement' : 'New placement'}</h2>
          <Badge>{editing ? serverStatus : 'Draft'}</Badge>
        </div>
        <p>
          Required information is shown to students before they apply. Publishing requires a
          complete listing; the monthly stipend is optional for unpaid internships.
        </p>
        {message && (
          <p role="alert" className="p-error">
            {message}
          </p>
        )}
        <ValidatedForm
          className="p-form"
          onSubmit={event => {
            event.preventDefault()
            if (busy) return
            void save(primaryTarget)
          }}
        >
          <Field className="p-field">
            <span>Role title *</span>
            <input
              name="title"
              required
              data-max={LIMITS.placementTitle}
              value={form.title}
              onChange={event => update('title', event.target.value)}
              aria-invalid={!!fieldErrors.title || form.title.length > LIMITS.placementTitle || undefined}
            />
            {fieldErrors.title && !lengthError(form.title, LIMITS.placementTitle) && <span className="p-error">{fieldErrors.title}</span>}
            <CharCount value={form.title} max={LIMITS.placementTitle} />
          </Field>
          {(['description', 'responsibilities', 'requirements'] as const).map(key => (
            <Field className="p-field" key={key}>
              <span>
                {key === 'description'
                  ? 'Description'
                  : key === 'responsibilities'
                    ? 'Responsibilities'
                    : 'Requirements'}{' '}
                *
              </span>
              <textarea
                name={key}
                required={requireComplete}
                value={form[key]}
                onChange={event => update(key, event.target.value)}
                aria-invalid={!!fieldErrors[key] || undefined}
              />
              {fieldErrors[key] && <span className="p-error">{fieldErrors[key]}</span>}
            </Field>
          ))}
          <div className="p-form-grid">
            <div className="p-field">
              <label htmlFor="placement-discipline">
                {MULTI_DISCIPLINE ? 'Eligible disciplines *' : 'Eligible discipline *'}
              </label>
              {MULTI_DISCIPLINE ? (
                <Combobox
                  multiple
                  id="placement-discipline"
                  name="discipline"
                  options={ENGINEERING_DISCIPLINES}
                  value={decodeDisciplines(form.discipline)}
                  onChange={values => update('discipline', encodeDisciplines(values))}
                  placeholder="Search disciplines, e.g. Civil"
                  invalid={!!fieldErrors.discipline}
                  pickMessage="Choose a discipline from the list."
                />
              ) : (
                <Combobox
                  id="placement-discipline"
                  name="discipline"
                  options={ENGINEERING_DISCIPLINES}
                  value={form.discipline}
                  onChange={value => update('discipline', value)}
                  placeholder="Search disciplines, e.g. Civil"
                  invalid={!!fieldErrors.discipline}
                  pickMessage="Choose a discipline from the list."
                />
              )}
              {fieldErrors.discipline && (
                <span className="p-error">{fieldErrors.discipline}</span>
              )}
            </div>
            <Field className="p-field">
              <span>Academic level requirement *</span>
              <select
                name="level"
                value={form.level}
                onChange={event => update('level', Number(event.target.value))}
              >
                {[100, 200, 300, 400, 500, 600, 700].map(level => (
                  <option value={level} key={level}>
                    {level} level and above
                  </option>
                ))}
              </select>
            </Field>
            <Field className="p-field">
              <span>Location *</span>
              <input
                name="location"
                required={requireComplete}
                data-max={LIMITS.placementLocation}
                value={form.location}
                placeholder="e.g. Lekki, Lagos"
                onChange={event => update('location', event.target.value)}
                aria-invalid={!!fieldErrors.location || form.location.length > LIMITS.placementLocation || undefined}
              />
              {fieldErrors.location && !lengthError(form.location, LIMITS.placementLocation) && <span className="p-error">{fieldErrors.location}</span>}
              <CharCount value={form.location} max={LIMITS.placementLocation} />
            </Field>
            <Field className="p-field">
              <span>Work style *</span>
              <select
                name="workStyle"
                value={form.workStyle}
                onChange={event => update('workStyle', event.target.value)}
              >
                <option>Hybrid</option>
                <option>Remote</option>
                <option>On-site</option>
              </select>
            </Field>
            <Field className="p-field">
              <span>Duration *</span>
              <input
                name="duration"
                required={requireComplete}
                data-max={LIMITS.placementDuration}
                list="placement-durations"
                value={form.duration}
                placeholder="e.g. 6 months"
                onChange={event => update('duration', event.target.value)}
                aria-invalid={!!fieldErrors.duration || form.duration.length > LIMITS.placementDuration || undefined}
              />
              <datalist id="placement-durations">
                {['3 months', '4 months', '6 months', '12 months'].map(option => <option key={option} value={option} />)}
              </datalist>
              {fieldErrors.duration && !lengthError(form.duration, LIMITS.placementDuration) && <span className="p-error">{fieldErrors.duration}</span>}
              <CharCount value={form.duration} max={LIMITS.placementDuration} />
            </Field>
            <Field className="p-field">
              <span>Monthly stipend (NGN) · optional</span>
              <input
                name="stipendAmount"
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={form.stipendAmount}
                onChange={event => update('stipendAmount', event.target.value)}
                aria-invalid={!!fieldErrors.stipendAmount || undefined}
              />
              {fieldErrors.stipendAmount && (
                <span className="p-error">{fieldErrors.stipendAmount}</span>
              )}
            </Field>
          </div>
          <p className="p-small">
            Stipend currency is NGN. Leave it empty for an unpaid internship — students see
            “Not specified” on the listing.
          </p>
          <div className="p-actions">
            {canSaveDraft && (
              <button
                type="button"
                className="p-button secondary"
                disabled={!!busy}
                onClick={() => void save('Draft')}
              >
                {busy === 'Draft' ? 'Saving…' : 'Save as draft'}
              </button>
            )}
            {canClose && (
              <button
                type="button"
                className="p-button secondary"
                disabled={!!busy}
                onClick={() => void save('Closed')}
              >
                {busy === 'Closed' ? 'Closing…' : 'Close placement'}
              </button>
            )}
            <button type="button" className="p-button secondary" onClick={() => setPreview(true)}>
              Preview
            </button>
            <button type="submit" className="p-button" disabled={!!busy}>
              {busy === (primaryTarget || 'save') ? 'Saving…' : primaryLabel}
            </button>
          </div>
        </ValidatedForm>
      </Panel>
      <aside className="p-stack">
        <Panel className="tinted">
          <p className="p-eyebrow">Before you publish</p>
          <h2>Listing checklist</h2>
          <ul className="p-checklist">
            <li>Clear title and role description</li>
            <li>Eligible discipline and academic level</li>
            <li>Location, work style, and duration</li>
            <li>Optional monthly stipend for paid roles</li>
            <li>Specific responsibilities and requirements</li>
          </ul>
          <p className="p-small">
            Published listings appear in student discovery immediately and can be closed at any
            time.
          </p>
        </Panel>
        <Panel>
          <h2>Status rules</h2>
          <p>
            Drafts are private. Published placements can be closed, and closed placements can be
            reopened. Expired or unpublished listings are managed by Fixth administrators.
          </p>
        </Panel>
      </aside>
      {preview && (
        <Modal title="Placement preview" onClose={() => setPreview(false)}>
          <div className="p-stack">
            <div className="p-between">
              <h3>{form.title.trim() || 'Untitled placement'}</h3>
              <Badge>{editing ? serverStatus : 'Draft'}</Badge>
            </div>
            <p>
              {disciplineLabel(form.discipline) || 'Discipline'} · {form.level}L+ · {form.location || 'Location'}
            </p>
            <p>
              {form.workStyle} · {form.duration || 'Duration'} ·{' '}
              {form.stipendAmount ? `₦${Number(form.stipendAmount).toLocaleString()}` : 'Not specified'}
            </p>
            <h4>Description</h4>
            <p>{form.description || 'No description yet.'}</p>
            <h4>Responsibilities</h4>
            <p>{form.responsibilities || 'No responsibilities yet.'}</p>
            <h4>Requirements</h4>
            <p>{form.requirements || 'No requirements yet.'}</p>
            <button type="button" className="p-button" onClick={() => setPreview(false)}>
              Close preview
            </button>
          </div>
        </Modal>
      )}
      </div>
    </>
  )
}

/** Keyed by placement so moving between listings never shows stale details. */
export function CompanyPlacementViewPage() {
  const { id } = useParams()
  return <CompanyPlacementView key={id} id={id ?? ''} />
}

/**
 * The organization's own read-only view of a listing, inside the company
 * workspace. Organizations never land on the student pages to check how a
 * listing reads; the public student link is only offered to copy and share.
 */
function CompanyPlacementView({ id }: { id: string }) {
  const [placement, setPlacement] = useState<StudentPlacement | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    getCompanyPlacement(id)
      .then(result => {
        if (live) setPlacement(result)
      })
      .catch(err => {
        if (!live) return
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setError(errorText(err, 'The placement could not be loaded.'))
      })
    return () => {
      live = false
    }
  }, [id, attempt])

  if (notFound) {
    return (
      <Panel>
        <Empty title="Placement not found">
          <p>It may have been removed, or it belongs to another organization.</p>
          <Link to="/company/placements" className="p-button">
            Back to listings
          </Link>
        </Empty>
      </Panel>
    )
  }
  if (error) {
    return (
      <Panel>
        <Empty title="Placement could not be loaded">
          <p>{error}</p>
          <button
            type="button"
            className="p-button"
            onClick={() => {
              setError('')
              setAttempt(value => value + 1)
            }}
          >
            Try again
          </button>
        </Empty>
      </Panel>
    )
  }
  if (!placement) return <Panel><p role="status">Loading placement…</p></Panel>

  const stipend = placement.stipendAmount
    ? `${placement.currency === 'NGN' || !placement.currency ? '₦' : `${placement.currency} `}${Number(placement.stipendAmount).toLocaleString()} / month`
    : 'Not specified'
  const sections: [string, string][] = [
    ['Description', placement.description],
    ['Responsibilities', placement.responsibilities],
    ['Requirements', placement.requirements],
  ]

  return (
    <>
      <Link to="/company/placements" className="p-text-link">
        ← Back to placements
      </Link>
      <div className="p-columns">
        <Panel className="p-article">
          <div className="p-listing-title">
            <h2>{placement.title}</h2>
            <Badge>{placement.status}</Badge>
          </div>
          <ul className="p-listing-meta" aria-label="Placement details">
            <li><GraduationCap aria-hidden size={13} />{disciplineLabel(placement.discipline) || 'Discipline not set'}</li>
            <li><MapPin aria-hidden size={13} />{placement.location || 'Location not set'}</li>
            <li><Building2 aria-hidden size={13} />{placement.workStyle}</li>
            <li><Clock3 aria-hidden size={13} />{placement.duration || 'Duration not set'}</li>
            <li><GraduationCap aria-hidden size={13} />{placement.level} level and above</li>
          </ul>
          {sections.map(([heading, text]) => (
            <section key={heading}>
              <h3>{heading}</h3>
              <p className="p-prewrap">{text || `No ${heading.toLowerCase()} yet.`}</p>
            </section>
          ))}
        </Panel>
        <aside className="p-stack">
          <Panel className="tinted">
            <p className="p-eyebrow">Manage listing</p>
            <dl className="p-definition">
              <div><dt>Status</dt><dd>{placement.status}</dd></div>
              <div><dt>Monthly stipend</dt><dd>{stipend}</dd></div>
              <div><dt>Created</dt><dd>{dateLabel(placement.createdAt)}</dd></div>
              {placement.publishedAt && <div><dt>Published</dt><dd>{dateLabel(placement.publishedAt)}</dd></div>}
            </dl>
            <div className="p-stack">
              <Link
                to={`/company/placements/${placement.id}/applicants`}
                state={{ from: `/company/placements/${placement.id}` }}
                className="p-button"
              >
                <Users aria-hidden size={15} />
                View applicants
              </Link>
              <Link to={`/company/placements/${placement.id}/edit`} className="p-button secondary">
                <Pencil aria-hidden size={15} />
                Edit placement
              </Link>
              {placement.status === 'Active' && <CopyLink slug={placement.slug} title={placement.title} />}
            </div>
            {placement.status === 'Active' && (
              <p className="p-small">Share the copied link with students. It opens the public listing.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  )
}
