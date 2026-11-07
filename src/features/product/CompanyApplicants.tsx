import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { FileText, MapPin } from 'lucide-react'
import { useDebounced } from '@/hooks/useDebounced'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'
import {
  getCompanyApplication,
  getApplicantContact,
  listCompanyApplications,
  listPlacementApplicants,
  updateCompanyApplicationStatus,
  type ApplicantContact,
  type CompanyApplication,
} from '@/services/companyApplications'
import { downloadDocument } from '@/services/documents'
import {
  getCompanyPlacement,
  type StudentPlacement,
} from '@/services/placements'
import { Badge, Empty, Metrics, Modal, Panel } from './components/ui'
import { dateLabel, initials } from './data'

const PAGE_SIZE = 20
const STATUSES = ['All', 'Submitted', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected'] as const

interface ApplicantMetrics {
  total: number
  viewed: number
  shortlisted: number
}

const blankMetrics: ApplicantMetrics = { total: 0, viewed: 0, shortlisted: 0 }

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

export function ApplicantsPage() {
  const { id } = useParams()
  const location = useLocation()
  const scoped = Boolean(id)
  const [placement, setPlacement] = useState<StudentPlacement | null>(null)
  const [placementError, setPlacementError] = useState('')
  const [placementLoading, setPlacementLoading] = useState(scoped)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [discipline, setDiscipline] = useState('All disciplines')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest')
  const debouncedQuery = useDebounced(query, 300)
  const [items, setItems] = useState<CompanyApplication[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [metrics, setMetrics] = useState<ApplicantMetrics>(blankMetrics)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const facets = useRef(new Set<string>())

  useEffect(() => {
    if (!id) {
      setPlacement(null)
      setPlacementLoading(false)
      setPlacementError('')
      return
    }
    let live = true
    setPlacementLoading(true)
    setPlacementError('')
    getCompanyPlacement(id)
      .then(result => {
        if (live) setPlacement(result)
      })
      .catch(err => {
        if (!live) return
        setPlacement(null)
        setPlacementError(
          err instanceof ApiError && err.status === 404
            ? 'This placement was not found or belongs to another organization.'
            : errorText(err, 'The placement could not be loaded.'),
        )
      })
      .finally(() => {
        if (live) setPlacementLoading(false)
      })
    return () => {
      live = false
    }
  }, [id])

  const fetchPage = (pageNumber: number, pageSize = PAGE_SIZE) => {
    const params = {
      status,
      q: debouncedQuery || undefined,
      discipline,
      sort,
      page: pageNumber,
      pageSize,
    }
    return id ? listPlacementApplicants(id, params) : listCompanyApplications(params)
  }

  useEffect(() => {
    if (scoped && !placement) {
      if (!placementLoading && placementError) setLoading(false)
      return
    }
    let live = true
    setLoading(true)
    setError('')
    fetchPage(1)
      .then(result => {
        if (!live) return
        result.results.forEach(application => {
          if (application.student.discipline) facets.current.add(application.student.discipline)
        })
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
        setError(errorText(err, 'Applicants could not be loaded.'))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, placement?.id, placementLoading, placementError, status, debouncedQuery, discipline, sort, attempt])

  useEffect(() => {
    if (scoped && !placement) return
    let live = true
    setMetricsLoading(true)
    const base = {
      q: debouncedQuery || undefined,
      discipline,
      pageSize: 1,
    }
    const call = (targetStatus: string) =>
      id
        ? listPlacementApplicants(id, { ...base, status: targetStatus })
        : listCompanyApplications({ ...base, status: targetStatus })
    Promise.all([call('All'), call('Viewed'), call('Shortlisted')])
      .then(([total, viewed, shortlisted]) => {
        if (!live) return
        setMetrics({
          total: total.count,
          viewed: viewed.count,
          shortlisted: shortlisted.count,
        })
      })
      .catch(() => {
        // The main table surfaces auth/company errors.
      })
      .finally(() => {
        if (live) setMetricsLoading(false)
      })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, placement?.id, debouncedQuery, discipline])

  const loadMore = () => {
    const nextPage = page + 1
    setLoadingMore(true)
    fetchPage(nextPage)
      .then(result => {
        result.results.forEach(application => {
          if (application.student.discipline) facets.current.add(application.student.discipline)
        })
        setItems(current => [...current, ...result.results])
        setHasMore(!!result.next)
        setPage(nextPage)
        setCount(result.count)
      })
      .catch(() => setError('More applicants could not be loaded. Try again.'))
      .finally(() => setLoadingMore(false))
  }

  const disciplineOptions = ['All disciplines', ...facets.current]
  const reviewHref = (applicationId: string) =>
    id ? `/company/placements/${id}/applicants/${applicationId}` : `/company/applicants/${applicationId}`

  if (placementLoading) return <Panel><p role="status">Loading placement…</p></Panel>
  if (placementError) {
    return (
      <Panel>
        <Empty title="Placement not found">
          <p>{placementError}</p>
          <Link to="/company/placements" className="p-button">
            Back to listings
          </Link>
        </Empty>
      </Panel>
    )
  }

  return (
    <>
      {placement ? (
        <Panel>
          <div className="p-between">
            <h2>{placement.title}</h2>
            <Badge>{placement.status}</Badge>
          </div>
          <p>
            <MapPin aria-hidden size={14} className="p-inline-icon" />
            {placement.location} · {placement.workStyle} · {placement.duration}
          </p>
          <div className="p-row-actions">
            {placement.status === 'Active' && (
              <Link to={`/p/${placement.slug}`} className="p-button subtle">
                View listing
              </Link>
            )}
            <Link to={`/company/placements/${placement.id}/edit`} className="p-button subtle">
              Edit placement
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="p-between p-section-head">
          <div>
            <h2>All applicants</h2>
            <p>Applications across every placement in your organization</p>
          </div>
          <Link to="/company/placements" className="p-button secondary">
            View placements
          </Link>
        </div>
      )}
      <Metrics
        items={[
          ['Applications', metricsLoading ? '…' : metrics.total],
          ['Viewed', metricsLoading ? '…' : metrics.viewed],
          ['Shortlisted', metricsLoading ? '…' : metrics.shortlisted],
        ]}
      />
      <div className="p-filters">
        <label className="p-search">
          <span className="p-sr">Search applicants</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search applicant name or skill"
          />
        </label>
        <label>
          <span className="p-sr">Discipline</span>
          <select value={discipline} onChange={event => setDiscipline(event.target.value)}>
            {disciplineOptions.map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="p-sr">Status</span>
          <select value={status} onChange={event => setStatus(event.target.value)}>
            {STATUSES.map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="p-sr">Sort applicants</span>
          <select value={sort} onChange={event => setSort(event.target.value as typeof sort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="p-between p-result-count">
        <p role="status">
          {loading ? 'Loading applicants…' : `${count} application${count === 1 ? '' : 's'}`}
        </p>
      </div>
      {error && (
        <Panel>
          <Empty title="Applicants could not be loaded">
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
            <p role="status">Loading applicants…</p>
          ) : items.length ? (
            <>
              <div className="p-table-wrap">
                <table role="table">
                  <thead>
                    <tr>
                      <th scope="col">Applicant</th>
                      {!scoped && <th scope="col">Placement</th>}
                      <th scope="col">Discipline</th>
                      <th scope="col">Level</th>
                      <th scope="col">Applied</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(application => (
                      <tr key={application.id}>
                        <td data-label="Applicant">
                          <div className="p-identity">
                            <span className="p-avatar">
                              {initials(application.student.fullName)}
                            </span>
                            <div>
                              <strong>{application.student.fullName}</strong>
                              <small>
                                {application.student.institution} ·{' '}
                                {application.student.location}
                              </small>
                            </div>
                          </div>
                        </td>
                        {!scoped && (
                          <td data-label="Placement">
                            {application.placement.title}
                          </td>
                        )}
                        <td data-label="Discipline">{application.student.discipline}</td>
                        <td data-label="Level">{application.student.level}L</td>
                        <td data-label="Applied">{dateLabel(application.appliedAt)}</td>
                        <td data-label="Status">
                          <Badge>{application.status}</Badge>
                        </td>
                        <td>
                          <div className="p-row-actions">
                            <Link
                              to={reviewHref(application.id)}
                              state={{ from: location.pathname }}
                              className="p-text-link"
                            >
                              Review<span className="p-sr"> {application.student.fullName}</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="p-button secondary"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more applicants'}
                </button>
              )}
            </>
          ) : (
            <Empty title="No matching applicants">
              <p>
                {query || status !== 'All' || discipline !== 'All disciplines'
                  ? 'Try a different search, discipline, or status.'
                  : 'Applications will appear here when students apply.'}
              </p>
            </Empty>
          )}
        </Panel>
      )}
    </>
  )
}

export function ApplicantReviewPage() {
  const { applicationId } = useParams()
  const location = useLocation()
  const backTo =
    (location.state as { from?: string } | null)?.from || '/company/applicants'
  const [application, setApplication] = useState<CompanyApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [notice, setNotice] = useState('')
  const [busyStatus, setBusyStatus] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [contactBusy, setContactBusy] = useState(false)
  const [contact, setContact] = useState<ApplicantContact | null>(null)
  const [contactError, setContactError] = useState('')

  useEffect(() => {
    if (!applicationId) return
    let live = true
    setLoading(true)
    setError('')
    setNotFound(false)
    getCompanyApplication(applicationId)
      .then(result => {
        if (live) setApplication(result)
      })
      .catch(err => {
        if (!live) return
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setError(errorText(err, 'The application could not be loaded.'))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [applicationId, attempt])

  const changeStatus = async (
    status: 'Viewed' | 'Shortlisted' | 'Accepted' | 'Rejected',
    reason?: string,
  ) => {
    if (!application) return
    setBusyStatus(status)
    setNotice('')
    try {
      const updated = await updateCompanyApplicationStatus(application.id, status, reason)
      setApplication(updated)
      setNotice(`${updated.student.fullName} was marked as ${status.toLowerCase()}.`)
      if (status === 'Rejected') {
        setRejectOpen(false)
        setRejectReason('')
        setRejectError('')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNotice('That status change is not allowed from the current status.')
      } else if (err instanceof ApiError && err.status === 400) {
        if (status === 'Rejected') setRejectError(apiErrorMessage(err.body, 'Add a reason and try again.'))
        else setNotice(apiErrorMessage(err.body, 'The status could not be updated.'))
      } else {
        setNotice(errorText(err, 'The status could not be updated.'))
      }
    } finally {
      setBusyStatus(null)
    }
  }

  const downloadResume = async () => {
    if (!application?.resume || downloading) return
    setDownloading(true)
    setDownloadError('')
    try {
      await downloadDocument(application.resume)
    } catch (err) {
      setDownloadError(errorText(err, 'The resume could not be downloaded.'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <Panel><p role="status">Loading application…</p></Panel>
  if (notFound) {
    return (
      <Panel>
        <Empty title="Applicant not found">
          <p>This application may have been removed or belongs to another organization.</p>
          <Link to={backTo} className="p-button">
            Back to applicants
          </Link>
        </Empty>
      </Panel>
    )
  }
  if (error || !application) {
    return (
      <Panel>
        <Empty title="Application could not be loaded">
          <p>{error || 'Something went wrong.'}</p>
          <button type="button" className="p-button" onClick={() => setAttempt(value => value + 1)}>
            Try again
          </button>
        </Empty>
      </Panel>
    )
  }

  const student = application.student
  const resume = application.resume
  const contactUnlocked = application.status === 'Shortlisted' || application.status === 'Accepted'
  const loadContact = async () => {
    if (contactBusy) return
    setContactBusy(true)
    setContactError('')
    try {
      setContact(await getApplicantContact(application.id))
    } catch (err) {
      setContactError(
        err instanceof ApiError && err.status === 403
          ? 'Contact details unlock once the application is shortlisted or accepted.'
          : errorText(err, 'Contact details could not be loaded.'),
      )
    } finally {
      setContactBusy(false)
    }
  }
  const statuses: Array<['Viewed' | 'Shortlisted' | 'Accepted' | 'Rejected', string]> = [
    ['Viewed', 'Mark as viewed'],
    ['Shortlisted', 'Shortlist'],
    ['Accepted', 'Accept'],
    ['Rejected', 'Reject'],
  ]

  return (
    <>
      <Link to={backTo} className="p-text-link">
        ← Back to applicants
      </Link>
      {notice && (
        <div role="status" className="p-panel tinted">
          <p>{notice}</p>
        </div>
      )}
      <div className="p-columns">
        <Panel>
          <div className="p-between">
            <div className="p-identity">
              <span className="p-avatar large">{initials(student.fullName)}</span>
              <div>
                <h2>{student.fullName}</h2>
                <p>
                  {student.discipline} · {student.level} level · {student.institution}
                </p>
                <p>
                  <MapPin aria-hidden size={14} className="p-inline-icon" />
                  {student.location}
                </p>
              </div>
            </div>
            <Badge>{student.verificationStatus}</Badge>
          </div>
          <div className="p-file">
            <FileText size={24} aria-hidden />
            <span className="p-grow">
              {resume ? resume.original_name : 'No resume attached'}
              <small>
                {resume
                  ? `${Math.max(1, Math.round(resume.size / 1024))} KB · ${resume.mime_type}`
                  : 'The applicant did not attach a resume.'}
              </small>
            </span>
            <button
              type="button"
              className="p-button subtle"
              disabled={downloading || !resume}
              onClick={() => void downloadResume()}
              title={resume ? undefined : 'No resume attached'}
            >
              {downloading ? 'Downloading…' : 'View resume'}
            </button>
          </div>
          {downloadError && (
            <p role="alert" className="p-error">
              {downloadError}
            </p>
          )}
          <h3>Academic profile</h3>
          <dl className="p-definition">
            {[
              ['Institution', student.institution],
              ['Discipline', student.discipline],
              ['Academic level', `${student.level} level`],
              ['Location', student.location],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
          <h3>Skills</h3>
          <p>{student.skills.length ? student.skills.join(' · ') : 'No skills listed.'}</p>
          <h3>Cover note</h3>
          <p>{application.coverNote || 'No cover note was provided.'}</p>
          <h3>Application timeline</h3>
          {application.events.length ? (
            <ol className="p-timeline">
              {application.events.map(event => (
                <li key={event.id}>
                  <strong>
                    {event.fromStatus ? `${event.fromStatus} → ` : ''}
                    {event.toStatus}
                  </strong>
                  <small>
                    {dateLabel(event.createdAt)}
                    {event.actorEmail ? ` · ${event.actorEmail}` : ''}
                  </small>
                  {event.reason && <p>{event.reason}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p>No status changes recorded yet.</p>
          )}
        </Panel>
        <aside className="p-stack">
          <Panel>
            <h2>Application status</h2>
            <p>Status changes are saved to Fixth and are visible to the student.</p>
            <Badge>{application.status}</Badge>
            {application.rejectionReason && (
              <p className="p-small">
                <strong>Rejection reason:</strong> {application.rejectionReason}
              </p>
            )}
            <div className="p-stack">
              {statuses.map(([status, label]) => (
                <button
                  type="button"
                  className={`p-button ${status === 'Rejected' ? 'danger' : status === 'Viewed' ? 'secondary' : ''}`}
                  disabled={application.status === status || !!busyStatus}
                  key={status}
                  onClick={() => {
                    if (status === 'Rejected') {
                      setRejectError('')
                      setRejectOpen(true)
                    } else {
                      void changeStatus(status)
                    }
                  }}
                >
                  {busyStatus === status ? 'Saving…' : label}
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2>Placement</h2>
            <p>
              <strong>{application.placement.title}</strong>
            </p>
            <p>
              {application.placement.location} · {application.placement.workStyle} ·{' '}
              {application.placement.duration}
            </p>
            <div className="p-row-actions">
              <Link
                to={`/company/placements/${application.placementId}/applicants`}
                className="p-button subtle"
              >
                Review applicants
              </Link>
              <Link
                to={`/company/placements/${application.placementId}/edit`}
                className="p-button subtle"
              >
                Edit placement
              </Link>
            </div>
          </Panel>
          <Panel>
            <h2>Contact candidate</h2>
            {contact ? (
              <dl className="p-definition">
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{contact.phone || 'Not provided'}</dd>
                </div>
              </dl>
            ) : (
              <p>
                {contactUnlocked
                  ? 'Fetch the applicant’s contact details to arrange interviews and next steps.'
                  : 'Contact details unlock once you shortlist this applicant or accept them.'}
              </p>
            )}
            {contactError && (
              <p role="alert" className="p-error">
                {contactError}
              </p>
            )}
            {contactUnlocked && (
              <button
                type="button"
                className="p-button secondary"
                disabled={contactBusy}
                onClick={() => void loadContact()}
              >
                {contactBusy ? 'Loading…' : contact ? 'Refresh details' : 'Show contact details'}
              </button>
            )}
          </Panel>
        </aside>
      </div>
      {rejectOpen && (
        <Modal title={`Reject ${student.fullName}?`} onClose={() => !busyStatus && setRejectOpen(false)}>
          <div className="p-form">
            <p>
              This updates the application to <strong>Rejected</strong> and records the change in
              the application timeline.
            </p>
            <label className="p-field">
              <span>Reason (optional)</span>
              <textarea
                value={rejectReason}
                maxLength={500}
                onChange={event => {
                  setRejectReason(event.target.value)
                  setRejectError('')
                }}
                placeholder="Share feedback the student will see"
              />
            </label>
            {rejectError && <p className="p-error">{rejectError}</p>}
            <div className="p-actions">
              <button
                type="button"
                className="p-button secondary"
                disabled={!!busyStatus}
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="p-button danger"
                disabled={!!busyStatus}
                onClick={() => void changeStatus('Rejected', rejectReason.trim() || undefined)}
              >
                {busyStatus === 'Rejected' ? 'Rejecting…' : 'Reject application'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
