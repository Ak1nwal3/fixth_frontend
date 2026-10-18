import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Bookmark, MapPin, Clock3, GraduationCap, ArrowRight, FileText, ShieldCheck } from 'lucide-react'
import { useProduct } from './useProduct'
import { type Placement, type ApplicationStatus, dateLabel } from './data'
import { Badge, Panel, Empty, Metrics, Tabs, Modal, CopyLink } from './components/ui'

function PlacementCard({ placement }: { placement: Placement }) {
  const { state, toggleSaved } = useProduct()
  const saved = state.saved.includes(placement.id)
  return <article className="p-placement-card"><div className="p-between"><div className="p-identity"><span className="p-company-mark">{placement.company === 'Meta' ? '∞' : placement.company[0]}</span><div><h2><Link to={`/p/${placement.slug}`}>{placement.title}</Link></h2><p>{placement.company} <ShieldCheck aria-label="Verified company" size={14} className="p-inline-success" /></p></div></div><button className="p-icon" type="button" aria-label={`${saved ? 'Unsave' : 'Save'} ${placement.title}`} aria-pressed={saved} onClick={() => toggleSaved(placement.id)}><Bookmark size={18} aria-hidden fill={saved ? 'currentColor' : 'none'} /></button></div><div className="p-tags"><span><MapPin aria-hidden size={13} />{placement.location} · {placement.workStyle}</span><span><Clock3 aria-hidden size={13} />{placement.duration}</span><span><GraduationCap aria-hidden size={13} />{placement.discipline}</span></div><div className="p-between p-card-foot"><span>Verified placement</span><strong>{placement.match}% match</strong></div></article>
}
export function DiscoverPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const { state } = useProduct()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [workStyles, setWorkStyles] = useState<string[]>((params.get('styles') || '').split(',').filter(Boolean))
  const [discipline, setDiscipline] = useState('All disciplines')
  const [location, setLocation] = useState('All locations')
  const [duration, setDuration] = useState('Any duration')
  const [sort, setSort] = useState('Best match')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const placements = state.placements.filter(p => p.status === 'Active' && (!savedOnly || state.saved.includes(p.id)) && `${p.title} ${p.company} ${p.discipline}`.toLowerCase().includes(query.toLowerCase()) && (discipline === 'All disciplines' || p.discipline === discipline) && (location === 'All locations' || p.location === location) && (duration === 'Any duration' || p.duration === duration) && (!workStyles.length || workStyles.includes(p.workStyle))).sort((a, b) => sort === 'Best match' ? b.match - a.match : a.title.localeCompare(b.title))
  const controls = <>
    <label className="p-field"><span>Discipline</span><select value={discipline} onChange={e => setDiscipline(e.target.value)}>{['All disciplines', ...new Set(state.placements.map(p => p.discipline))].map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="p-field"><span>Location</span><select value={location} onChange={e => setLocation(e.target.value)}>{['All locations', ...new Set(state.placements.map(p => p.location))].map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="p-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{['Any duration', ...new Set(state.placements.map(p => p.duration))].map(value => <option key={value}>{value}</option>)}</select></label>
  </>
  return <div className="p-columns"><div>
    <div className="p-toolbar"><label className="p-search"><span className="p-sr">Search role, company or skill</span><input type="search" value={query} placeholder="Search role, company or skill" onChange={e => setQuery(e.target.value)} /></label>
      <div className="p-discovery-filters">{controls}</div>
      <div className="p-mobile-filter-buttons">{['Discipline', 'Location', 'Duration'].map(label => <button type="button" className="p-button secondary" key={label} onClick={() => setFiltersOpen(true)}>{label}</button>)}</div>
      {workStyles.length > 0 && <button type="button" className="p-button subtle" onClick={() => setWorkStyles([])}>Clear {workStyles.join(' · ')} filter</button>}
    </div>
    <div className="p-between p-result-count"><p role="status">{placements.length} {savedOnly ? 'saved' : 'verified'} placements</p><label><span className="p-sr">Sort placements</span><select value={sort} onChange={e => setSort(e.target.value)}><option>Best match</option><option>Title A–Z</option></select></label></div>
    <div className="p-stack">{placements.length ? placements.map(p => <PlacementCard key={p.id} placement={p} />) : <Panel><Empty title={savedOnly ? 'No saved placements yet' : 'No matching placements'}><p>{savedOnly ? 'Save a placement to return to it later.' : 'Try a different role, location, or discipline.'}</p><Link className="p-button" to="/student/discover">Discover placements</Link></Empty></Panel>}</div>
  </div><aside className="p-stack p-secondary-rail"><Panel><div className="p-between"><h2>Application profile</h2><Badge>{state.profile.resume ? 'Ready' : 'Resume needed'}</Badge></div><p>Your Fixth profile and resume are used for one-click applications.</p><Link className="p-file" to="/student/resume"><FileText size={20} aria-hidden /><span>{state.profile.resume || 'Add your active resume'}<small>Manage resume →</small></span></Link></Panel><Panel className="tinted"><p className="p-eyebrow">Placement alerts</p><h2>Get notified first</h2><p>Verified roles are matched to your discipline. Keep your profile preferences up to date.</p><Link to="/student/profile/edit" className="p-text-link">Update preferences →</Link></Panel></aside>
  {filtersOpen && <Modal title="Filter placements" onClose={() => setFiltersOpen(false)}><div className="p-form">{controls}<button type="button" className="p-button" onClick={() => { setDiscipline('All disciplines'); setLocation('All locations'); setDuration('Any duration'); setWorkStyles([]) }}>Reset filters</button><button type="button" className="p-button" onClick={() => setFiltersOpen(false)}>Show {placements.length} placements</button></div></Modal>}
  </div>
}
export function PlacementDetailPage() {
  const { slug, id } = useParams()
  const { state, apply, resumeFile } = useProduct()
  const [confirm, setConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const placement = state.placements.find(p => slug ? p.slug === slug : p.id === id)
  if (!placement || placement.status === 'Draft' || placement.status === 'Unpublished') return <Panel><Empty title="Placement unavailable"><p>This posting is not currently published.</p><Link to="/student/discover" className="p-button">Discover placements</Link></Empty></Panel>
  const applied = state.applications.some(a => a.placementId === placement.id)
  const eligible = state.profile.level >= placement.level && state.profile.discipline.toLowerCase() === placement.discipline.toLowerCase()
  const open = placement.status === 'Active'
  const ready = eligible && !!state.profile.resume && !!resumeFile && !state.deleted
  return <><div className="p-breadcrumb"><Link to="/student/discover">← Discover placements</Link><span>{placement.title}</span></div><div className="p-columns details"><Panel className="p-article"><div className="p-identity"><span className="p-company-mark">{placement.company[0]}</span><div><h2>{placement.title}</h2><p>{placement.company} <ShieldCheck className="p-inline-success" size={15} aria-label="Verified company" /></p></div></div><div className="p-tags"><span><MapPin size={14} aria-hidden />{placement.location} · {placement.workStyle}</span><span><Clock3 size={14} aria-hidden />{placement.duration}</span><span><GraduationCap size={14} aria-hidden />{placement.discipline}</span></div><section><h3>About the role</h3><p>{placement.description}</p></section><section><h3>What you’ll do</h3><p>{placement.responsibilities}</p></section><section><h3>What we’re looking for</h3><p>{placement.requirements}</p><p>{placement.discipline} · {placement.level} level and above</p></section><section><h3>Monthly stipend</h3><p>{placement.stipend}</p></section><div className="p-mobile-share"><CopyLink slug={placement.slug} title={placement.title} /></div></Panel><aside><Panel className="p-apply-panel"><Badge tone={eligible ? 'success' : 'warning'}>{eligible ? 'You’re eligible' : 'Eligibility requirements'}</Badge><h2>{applied ? 'Application submitted' : open ? 'Apply in one step' : 'Applications closed'}</h2><p>Your Fixth profile and uploaded resume will be shared. No cover letter required.</p><div className="p-file"><FileText aria-hidden size={20} /><span>Fixth student profile<small>{state.profile.resume || 'No resume uploaded'}</small></span></div>{!eligible && <p className="p-callout warning">This placement requires {placement.discipline}, {placement.level} level or above. <Link to="/student/profile/edit">Review your academic details.</Link></p>}{eligible && (!state.profile.resume || !resumeFile) && <Link to="/student/resume" className="p-text-link">Select your resume file to apply →</Link>}<button className="p-button" type="button" disabled={!ready || !open || applied} onClick={() => setConfirm(true)}>{applied ? 'Already applied' : !open ? 'Applications closed' : 'Apply with Fixth profile'}<ArrowRight size={16} aria-hidden /></button><p className="p-small">By applying, you agree to share your profile with this company.</p><hr /><h3>Share this placement</h3><p className="p-small">{window.location.host}/p/{placement.slug}</p><CopyLink slug={placement.slug} title={placement.title} /></Panel></aside></div><p role="status" className="p-live">{notice}</p>{confirm && <Modal title="Confirm your application" onClose={() => setConfirm(false)}><p>Apply to <strong>{placement.title}</strong> at {placement.company}?</p><div className="p-callout"><p>{state.profile.firstName} {state.profile.lastName}</p><p>{state.profile.resume}</p></div><p>Your profile and resume will be attached to this local preview application.</p><div className="p-actions"><button type="button" className="p-button secondary" onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="p-button" onClick={() => { apply(placement.id); setConfirm(false); setNotice('Application submitted in this preview.'); }}>Confirm application</button></div></Modal>}</>
}
export function ApplicationsPage() {
  const { state } = useProduct()
  const [status, setStatus] = useState('All')
  const statuses: ApplicationStatus[] = ['Submitted', 'Viewed', 'Shortlisted', 'Rejected', 'Accepted']
  const applications = state.applications.filter(a => status === 'All' || a.status === status)
  return <><Metrics items={([['Total', state.applications.length], ...['Viewed', 'Shortlisted', 'Accepted'].map(value => [value, state.applications.filter(a => a.status === value).length])] as [string, number][])} /><div className="p-columns"><div className="p-stack"><Tabs items={['All', ...statuses]} value={status} onChange={setStatus} label="Application status" /><Panel>{applications.length ? <div className="p-table-wrap"><table role="table"><thead><tr><th scope="col">Placement</th><th scope="col">Applied</th><th scope="col">Status</th><th scope="col"><span className="p-sr">Actions</span></th></tr></thead><tbody>{applications.map(a => { const p = state.placements.find(p => p.id === a.placementId); return <tr key={a.id}><td data-label="Placement"><strong>{p?.title || 'Placement no longer available'}</strong><small>{p?.company}</small></td><td data-label="Applied">{dateLabel(a.date)}</td><td data-label="Status"><Badge>{a.status}</Badge></td><td>{p && <Link to={`/p/${p.slug}`} className="p-text-link">View<span className="p-sr"> {p.title}</span></Link>}</td></tr> })}</tbody></table></div> : <Empty title="No applications in this category"><Link to="/student/discover" className="p-button">Discover placements</Link></Empty>}</Panel></div><aside><Panel><h2>Status updates</h2><p>Your applications will appear here as they move through the review process.</p>{state.applications.slice(0, 3).map(a => <div className="p-update" key={a.id}><strong>{a.status}</strong><p>{state.placements.find(p => p.id === a.placementId)?.company} · {dateLabel(a.date)}</p></div>)}</Panel></aside></div></>
}





