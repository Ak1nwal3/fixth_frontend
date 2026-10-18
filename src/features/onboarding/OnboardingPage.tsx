import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ShieldCheck, Upload } from 'lucide-react'
import AuthShell from './components/AuthShell'
import ProgressSteps from './components/ProgressSteps'
import PrimaryButton from './components/PrimaryButton'
import VerificationCode from './components/VerificationCode'
import { flows, readDraft, saveDraft, type Draft, type Track } from './flow'
import { useProduct } from '@/features/product/useProduct'

export default function OnboardingPage() {
  const { track, step = 'email' } = useParams()
  if (track !== 'organization' && track !== 'student') return <Navigate to="/" replace />
  return <OnboardingFlow key={`${track}-${step}`} track={track} slug={step} />
}
function OnboardingFlow({ track, slug }: { track: Track; slug: string }) {
  const navigate = useNavigate()
  const { state, updateProfile } = useProduct()
  const [draft, setDraft] = useState<Draft>(() => readDraft(track))
  const [code, setCode] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }); document.getElementById('auth-content')?.scrollTo(0, 0) }, [slug])
  const steps = flows[track]
  const index = steps.findIndex(step => step.slug === slug)
  const step = steps[index]
  const organization = track === 'organization'
  const base = `/onboarding/${track}`
  const update = (name: string, value: string) => {
    const next = { ...draft, [name]: value }
    setDraft(next); saveDraft(track, next)
    setErrors(current => ({ ...current, [name]: '' }))
  }
  const selected = (draft.skills || '').split(',').filter(Boolean)
  if (slug === 'complete') return <AuthShell brand="" organization={organization} story="Your next chapter starts here."><div className="onboarding-form"><ShieldCheck className="size-12 text-brand" aria-hidden /><h1 ref={heading} tabIndex={-1}>Profile saved</h1><p>Your {track} profile is saved in this browser session. Explore the sample workspace while account creation and verification await the Fixth API.</p><Link className="auth-secondary-link" to={organization ? '/company/placements' : '/student/discover'}>Continue to placements</Link><Link className="auth-text-link" to={`${base}/review`}>Review profile</Link><Link className="auth-text-link" to="/">Back to home</Link></div></AuthShell>
  if (!step) return <Navigate to={`${base}/email`} replace />
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (slug === 'code' && !/^\d{6}$/.test(code)) { setMessage('Enter all six digits.'); return }
    if (slug === 'skills' && !selected.length) { setMessage('Select at least one skill to continue.'); return }
    if (slug === 'review') {
      const missing = steps.find(item => item.fields?.some(field => !draft[field.name]?.trim()) || (item.slug === 'skills' && !selected.length))
      if (missing) { navigate(`${base}/${missing.slug}`); return }
      if (!organization) updateProfile({ ...state.profile,
        firstName: draft.firstName, lastName: draft.lastName, email: draft.email, phone: draft.phone,
        institution: draft.institution, discipline: draft.course, level: parseInt(draft.level, 10) || 400,
        location: draft.location, duration: draft.duration, workStyle: draft.workStyle, skills: selected.join(' · '),
      })
    }
    setMessage(''); navigate(`${base}/${steps[index + 1]?.slug || 'complete'}`)
  }
  const rows = organization
    ? [['Organization', draft.organization, 'details'], ['Work email', draft.email, 'email'], ['Industry', draft.industry, 'details'], ['Location', [draft.city, draft.country].filter(Boolean).join(', '), 'story'], ['Website', draft.website, 'details']]
    : [['Profile', [draft.firstName, draft.lastName].filter(Boolean).join(' '), 'about'], ['Email', draft.email, 'email'], ['Education', [draft.course, draft.level].filter(Boolean).join(' · '), 'education'], ['Preferences', [draft.location, draft.workStyle, draft.duration].filter(Boolean).join(' · '), 'preferences'], ['Skills', selected.join(', '), 'skills']]
  const autocomplete: Record<string, string> = { email: 'email', firstName: 'given-name', lastName: 'family-name', phone: 'tel', organization: 'organization', website: 'url', country: 'country-name', city: 'address-level2', address: 'street-address' }
  return <AuthShell brand="" organization={organization} story={step.story}>
    <form className="onboarding-form" onSubmit={submit} key={slug} onInvalidCapture={e => {
      const target = e.target as HTMLInputElement
      if (target.name.startsWith('code-')) setErrors(current => ({ ...current, code: 'Enter all six digits.' }))
      else setErrors(current => ({ ...current, [target.name]: target.validationMessage }))
    }}>
      <ProgressSteps total={steps.length} current={index + 1} />
      <p className="auth-eyebrow">{organization ? 'Organization' : 'Student'} profile · Step {index + 1} of {steps.length}</p>
      <h1 ref={heading} tabIndex={-1}>{step.title}</h1>
      <p>{slug === 'code' ? `Enter the 6-digit code for ${draft.email || 'your email address'}.` : step.subtitle}</p>
      {step.upload && <label className="auth-upload"><Upload className="size-5 text-brand" aria-hidden /><span>{draft[`${slug}File`] || step.upload}</span><input name="attachment" type="file" accept={slug === 'education' ? '.pdf,.jpg,.jpeg,.png' : 'image/*'} aria-describedby="upload-note" onChange={e => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { setMessage('Choose a file smaller than 5 MB.'); e.target.value = ''; return }
        if (slug === 'education' ? !/\.(pdf|jpg|jpeg|png)$/i.test(file.name) : !file.type.startsWith('image/')) { setMessage('Choose a supported file type.'); e.target.value = ''; return }
        update(`${slug}File`, file.name); setMessage('')
      }} /><small id="upload-note">Maximum 5 MB. Your selection stays local to this preview.</small></label>}
      {step.fields?.map(field => <label className="auth-field" key={field.name}>
        <span>{field.label}</span>
        {field.options ? <select name={field.name} required value={draft[field.name] || ''} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
          : field.type === 'textarea' ? <textarea name={field.name} required maxLength={500} value={draft[field.name] || ''} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)} />
          : <input name={field.name} required type={field.type || 'text'} autoComplete={autocomplete[field.name] || 'off'} value={draft[field.name] || ''} placeholder={field.placeholder} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)} />}
        {errors[field.name] && <span id={`${field.name}-error`} className="auth-field-error">{errors[field.name]}</span>}
      </label>)}
      {slug === 'code' && <><VerificationCode value={code} onChange={value => { setCode(value); setErrors(current => ({ ...current, code: '' })) }} invalid={!!errors.code} />{errors.code && <p id="code-error" className="auth-field-error">{errors.code}</p>}<p id="verification-note" className="auth-note">Preview mode: enter six digits to view the next screen. No verification email has been sent.</p></>}
      {slug === 'skills' && <><label className="auth-field"><span>Search skills</span><input name="skill-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by skill" /></label><p>Selected skills · {selected.length}</p><div className="auth-skills">{Array.from(new Set(['AutoCAD', 'Teamwork', 'Data analysis', 'Site inspection', 'Civil 3D', 'Communication', 'Python', 'Project management', ...selected])).filter(skill => skill.toLowerCase().includes(search.toLowerCase())).map(skill => <button type="button" aria-pressed={selected.includes(skill)} key={skill} onClick={() => update('skills', (selected.includes(skill) ? selected.filter(item => item !== skill) : [...selected, skill]).join(','))}>{selected.includes(skill) ? '✓ ' : '+ '}{skill}</button>)}</div></>}
      {slug === 'review' && <><dl className="auth-review">{rows.map(([label, value, target]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd><Link to={`${base}/${target}`} aria-label={`Edit ${label?.toLowerCase()}`}>Edit</Link></div>)}</dl><p className="auth-note">Everything looks ready. You can edit this information later.</p></>}
      {slug === 'email' && <div className="auth-note"><ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden /><span>{organization ? 'Your company email' : 'Your email'} stays private and secure.</span></div>}
      <p role="alert" className="auth-field-error">{message}</p>
      <div className="auth-actions">{index > 0 && <Link to={`${base}/${steps[index - 1]!.slug}`} className="auth-back"><ArrowLeft className="size-4" aria-hidden />Back</Link>}<PrimaryButton type="submit">{slug === 'email' ? 'Send verification code' : slug === 'code' ? 'Verify and continue' : slug === 'review' ? 'Save and finish' : 'Continue'}</PrimaryButton></div>
      {slug === 'code' && <button type="button" className="auth-text-link" onClick={() => setMessage('Email delivery is not connected yet. Use any six digits to preview the flow.')}>Didn’t receive it? Resend code</button>}
    </form>
  </AuthShell>
}

