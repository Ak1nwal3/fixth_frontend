import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ShieldCheck, Upload } from 'lucide-react'
import AuthShell from './components/AuthShell'
import ProgressSteps from './components/ProgressSteps'
import PrimaryButton from './components/PrimaryButton'
import VerificationCode from './components/VerificationCode'
import { clearDraft, flows, readDraft, saveDraft, type Draft, type Track } from './flow'
import { passwordError, passwordRules } from '@/lib/password'
import { useAuth } from '@/features/auth/useAuth'
import { completeStudentOnboarding, requestStudentOtp, verifyStudentOtp } from '@/services/onboarding'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'

/** Read from event handlers/effects only, keeping clock access out of render. */
const timestamp = () => Date.now()

export default function OnboardingPage() {
  const { track, step = 'email' } = useParams()
  if (track !== 'organization' && track !== 'student') return <Navigate to="/" replace />
  return <OnboardingFlow key={`${track}-${step}`} track={track} slug={step} />
}
function OnboardingFlow({ track, slug }: { track: Track; slug: string }) {
  const navigate = useNavigate()
  const { establishSession } = useAuth()
  const [draft, setDraft] = useState<Draft>(() => readDraft(track))
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const codeSentAt = Number(draft.lastCodeAt || 0)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }); document.getElementById('auth-content')?.scrollTo(0, 0) }, [slug])
  useEffect(() => {
    if (!codeSentAt) return
    const tick = () =>
      setCooldown(Math.max(0, 60 - Math.floor((timestamp() - codeSentAt) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [codeSentAt])
  const steps = flows[track]
  const index = steps.findIndex(step => step.slug === slug)
  const step = steps[index]
  const passwordIndex = steps.findIndex(item => item.slug === 'password')
  const codeIndex = steps.findIndex(item => item.slug === 'code')
  const passwordRulesMet = passwordRules.map(rule => ({ ...rule, met: rule.test(password) }))
  const keepingExistingPassword = !!draft.passwordSet && !password && !confirm
  const passwordValid = keepingExistingPassword || (!!password && password === confirm && !passwordError(password, draft.email))
  const organization = track === 'organization'
  const base = `/onboarding/${track}`
  const update = (name: string, value: string) => {
    const next = { ...draft, [name]: value }
    setDraft(next); saveDraft(track, next)
    setErrors(current => ({ ...current, [name]: '' }))
  }
  const patchDraft = (fields: Draft) => {
    const next = { ...draft, ...fields }
    setDraft(next); saveDraft(track, next)
  }
  const selected = (draft.skills || '').split(',').filter(Boolean)
  const suggestedSkills = ['AutoCAD', 'Teamwork', 'Data analysis', 'Site inspection', 'Civil 3D', 'Communication', 'Python', 'Project management']
  const customSkill = search.trim()
  const exactSkill = [...suggestedSkills, ...selected].find(skill => skill.toLowerCase() === customSkill.toLowerCase())
  const canAddCustomSkill = customSkill.length > 0 && !exactSkill
  const addCustomSkill = () => {
    if (!canAddCustomSkill) return
    update('skills', [...selected, customSkill].join(','))
    setSearch('')
  }
  const addSkillFromSearch = () => {
    if (exactSkill) {
      if (!selected.some(skill => skill.toLowerCase() === exactSkill.toLowerCase())) update('skills', [...selected, exactSkill].join(','))
      setSearch('')
      return
    }
    addCustomSkill()
  }
  const isSkillSelected = (skill: string) => selected.some(item => item.toLowerCase() === skill.toLowerCase())
  const toggleSkill = (skill: string) => {
    update('skills', (isSkillSelected(skill) ? selected.filter(item => item.toLowerCase() !== skill.toLowerCase()) : [...selected, skill]).join(','))
  }
  if (slug === 'complete') {
    if (organization) return <AuthShell brand="" organization story="Your next chapter starts here."><div className="onboarding-form"><ShieldCheck className="size-12 text-brand" aria-hidden /><h1 ref={heading} tabIndex={-1}>You’re all set</h1><p>Your organization profile and password are saved for this preview session. Sign in with your email and password once the Fixth API is connected, or explore the sample workspace now.</p><Link className="auth-secondary-link" to="/auth/organization/sign-in">Sign in</Link><Link className="auth-text-link" to="/company/placements">Explore a sample workspace →</Link><Link className="auth-text-link" to={`${base}/review`}>Review profile</Link><Link className="auth-text-link" to="/">Back to home</Link></div></AuthShell>
    return <AuthShell brand="" story="Your next chapter starts here."><div className="onboarding-form"><ShieldCheck className="size-12 text-brand" aria-hidden /><h1 ref={heading} tabIndex={-1}>You’re all set</h1><p>Your student account is ready and you’re signed in. Start discovering verified placements matched to your discipline.</p><Link className="auth-secondary-link" to="/student/discover">Discover placements</Link><Link className="auth-text-link" to="/student/profile">View your profile →</Link><Link className="auth-text-link" to="/">Back to home</Link></div></AuthShell>
  }
  if (!step) return <Navigate to={`${base}/email`} replace />
  // Student flow guards: each API-backed step depends on the previous one.
  if (!organization && index > 0 && !draft.email) return <Navigate to={`${base}/email`} replace />
  if (!organization && codeIndex >= 0 && index > codeIndex && !draft.code) return <Navigate to={`${base}/code`} replace />
  if (passwordIndex >= 0 && index > passwordIndex && !draft.passwordSet) return <Navigate to={`${base}/password`} replace />

  const requestCode = async () => {
    setBusy(true)
    setMessage('')
    try {
      await requestStudentOtp(draft.email)
      // Persist the send time so the resend countdown survives step remounts.
      patchDraft({ lastCodeAt: String(timestamp()) })
      return true
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.status === 429
            ? 'Too many requests. Please wait before requesting another code.'
            : apiErrorMessage(error.body, 'Could not send the verification code.')
          : 'Could not reach the server. Check your connection and try again.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  const submitStudent = async (): Promise<string | null> => {
    // Returns the next step slug, or null when the flow should stay put.
    if (slug === 'email') {
      return (await requestCode()) ? 'code' : null
    }
    if (slug === 'code') {
      setBusy(true)
      setMessage('')
      try {
        // Verification checks the code without consuming it; completion consumes it.
        await verifyStudentOtp(draft.email, code)
        update('code', code)
        return 'password'
      } catch (error) {
        setMessage(
          error instanceof ApiError
            ? error.status === 429
              ? 'Too many attempts. Please wait before trying again.'
              : apiErrorMessage(error.body, 'Invalid or expired verification code.')
            : 'Could not reach the server. Check your connection and try again.',
        )
        return null
      } finally {
        setBusy(false)
      }
    }
    if (slug === 'review') {
      setBusy(true)
      setMessage('')
      try {
        const result = await completeStudentOnboarding({
          email: draft.email,
          code: draft.code,
          ...(draft.password ? { password: draft.password } : {}),
          first_name: draft.firstName,
          last_name: draft.lastName,
          ...(draft.phone ? { phone: draft.phone } : {}),
          location: draft.location,
          institution: draft.institution,
          discipline: draft.course,
          level: parseInt(draft.level, 10) || 400,
          skills: selected,
        })
        establishSession('student', { access: result.access, refresh: result.refresh, user: result.user })
        clearDraft('student')
        return 'complete'
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 409) setMessage('This email is already registered. Try signing in instead.')
          else if (error.status === 429) setMessage('Too many attempts. Please wait before trying again.')
          else setMessage(apiErrorMessage(error.body, 'Your details could not be saved. Please review them and try again.'))
        } else {
          setMessage('Could not reach the server. Check your connection and try again.')
        }
        return null
      } finally {
        setBusy(false)
      }
    }
    return steps[index + 1]?.slug || 'complete'
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    if (slug === 'code' && !/^\d{6}$/.test(code)) { setMessage('Enter all six digits.'); return }
    if (slug === 'password') {
      const error = keepingExistingPassword ? null : passwordError(password, draft.email) || (password !== confirm ? 'Passwords do not match.' : '')
      if (error) { setMessage(error); return }
      if (!keepingExistingPassword) patchDraft({ passwordSet: 'true', ...(!organization ? { password } : {}) })
      setPassword(''); setConfirm('')
    }
    if (slug === 'skills' && !selected.length) { setMessage('Select at least one skill to continue.'); return }
    if (slug === 'review' && organization) {
      if (!draft.passwordSet) { navigate(`${base}/password`); return }
      const missing = steps.find(item => item.fields?.some(field => !field.optional && !draft[field.name]?.trim()) || (item.slug === 'skills' && !selected.length))
      if (missing) { navigate(`${base}/${missing.slug}`); return }
    }
    if (slug === 'review' && !organization) {
      if (!draft.passwordSet) { navigate(`${base}/password`); return }
      if (!draft.code) { navigate(`${base}/code`); return }
      const missing = steps.find(item => item.fields?.some(field => !field.optional && !draft[field.name]?.trim()) || (item.slug === 'skills' && !selected.length))
      if (missing) { navigate(`${base}/${missing.slug}`); return }
    }
    setMessage('')
    const next = organization ? steps[index + 1]?.slug || 'complete' : await submitStudent()
    if (next) navigate(`${base}/${next}`)
  }
  const rows = organization
    ? [['Organization', draft.organization, 'details'], ['Work email', draft.email, 'email'], ['Industry', draft.industry, 'details'], ['Location', [draft.city, draft.country].filter(Boolean).join(', '), 'story'], ['Website', draft.website, 'details']]
    : [['Profile', [draft.firstName, draft.lastName].filter(Boolean).join(' '), 'about'], ['Email', draft.email, 'email'], ['Location', draft.location, 'about'], ['Education', [draft.course, draft.level].filter(Boolean).join(' · '), 'education'], ['Skills', selected.join(', '), 'skills']]
  const autocomplete: Record<string, string> = { email: 'email', firstName: 'given-name', lastName: 'family-name', phone: 'tel', location: 'address-level2', organization: 'organization', website: 'url', country: 'country-name', city: 'address-level2', address: 'street-address' }
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
        <span>{field.label}{field.optional ? ' (optional)' : ''}</span>
        {field.options ? <select name={field.name} required={!field.optional} value={draft[field.name] || ''} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
          : field.type === 'textarea' ? <textarea name={field.name} required={!field.optional} maxLength={500} value={draft[field.name] || ''} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)} />
          : <input name={field.name} required={!field.optional} type={field.type || 'text'} autoComplete={autocomplete[field.name] || 'off'} value={draft[field.name] || ''} placeholder={field.placeholder} aria-invalid={!!errors[field.name] || undefined} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} onChange={e => update(field.name, e.target.value)} />}
        {errors[field.name] && <span id={`${field.name}-error`} className="auth-field-error">{errors[field.name]}</span>}
      </label>)}
      {slug === 'code' && <><VerificationCode value={code} onChange={value => { setCode(value); setErrors(current => ({ ...current, code: '' })) }} invalid={!!errors.code} />{errors.code && <p id="code-error" className="auth-field-error">{errors.code}</p>}<p id="verification-note" className="auth-note">{organization ? 'Preview mode: enter six digits to view the next screen. No verification email has been sent.' : 'We emailed you a 6-digit code. It expires after 10 minutes.'}</p></>}
      {slug === 'password' && <>
        <label className="auth-field"><span>Password</span><input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={password} aria-invalid={!!errors.password || undefined} aria-describedby="password-rules" onChange={e => { setPassword(e.target.value); setErrors(current => ({ ...current, password: '' })); setMessage('') }} />{errors.password && <span className="auth-field-error">{errors.password}</span>}</label>
        <label className="auth-field"><span>Confirm password</span><input name="confirmPassword" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={confirm} aria-invalid={!!errors.confirmPassword || undefined} aria-describedby="password-rules" onChange={e => { setConfirm(e.target.value); setErrors(current => ({ ...current, confirmPassword: '' })); setMessage('') }} />{errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}</label>
        <button type="button" className="auth-text-link self-start" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide passwords' : 'Show passwords'}</button>
        <div className="auth-strength" aria-hidden="true">
          {passwordRules.map(rule => <span key={rule.id} data-met={rule.test(password)} />)}
        </div>
        <ul className="auth-rules" id="password-rules" aria-label="Password requirements">
          {passwordRulesMet.map(rule => <li key={rule.id} data-met={rule.met}>{rule.met ? '✓' : '○'} {rule.label}</li>)}
          <li data-met={!!password && password === confirm}>{password && password === confirm ? '✓' : '○'} Passwords match</li>
        </ul>
        <p className="auth-note">{keepingExistingPassword ? 'Your password is already set for this session. Continue, or enter a new one to replace it.' : organization ? 'Preview mode: your password stays in this browser session. The Fixth API will hash and store it securely once connected.' : 'Your password is stored securely by the Fixth API when you finish.'}</p>
      </>}
      {slug === 'skills' && <>
        <label className="auth-field"><span>Search skills</span><input name="skill-search" type="search" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (exactSkill || canAddCustomSkill)) { e.preventDefault(); addSkillFromSearch() } }} placeholder="Search or type a new skill" /></label>
        <p>Selected skills · {selected.length}</p>
        <p className="auth-note">Choose a suggestion or type a skill and add it to your profile.</p>
        <div className="auth-skills">
          {Array.from(new Set([...suggestedSkills, ...selected])).filter(skill => skill.toLowerCase().includes(search.toLowerCase())).map(skill => <button type="button" aria-pressed={isSkillSelected(skill)} key={skill} onClick={() => toggleSkill(skill)}>{isSkillSelected(skill) ? '✓ ' : '+ '}{skill}</button>)}
          {canAddCustomSkill && <button type="button" onClick={addCustomSkill} aria-label={`Add ${customSkill} as a new skill`}>+ Add “{customSkill}”</button>}
        </div>
      </>}
      {slug === 'review' && <><dl className="auth-review">{rows.map(([label, value, target]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd><Link to={`${base}/${target}`} aria-label={`Edit ${label?.toLowerCase()}`}>Edit</Link></div>)}</dl><p className="auth-note">Everything looks ready. You can edit this information later.</p></>}
      {slug === 'email' && <div className="auth-note"><ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden /><span>{organization ? 'Your company email' : 'Your email'} stays private and secure.</span></div>}
      <p role="alert" className="auth-field-error">{message}</p>
      <div className="auth-actions">{index > 0 && <Link to={`${base}/${steps[index - 1]!.slug}`} className="auth-back"><ArrowLeft className="size-4" aria-hidden />Back</Link>}<PrimaryButton type="submit" disabled={busy || (slug === 'password' && !passwordValid)}>{busy ? 'Please wait…' : slug === 'email' ? 'Send verification code' : slug === 'code' ? 'Verify and continue' : slug === 'review' ? 'Save and finish' : 'Continue'}</PrimaryButton></div>
      {slug === 'code' && (organization
        ? <button type="button" className="auth-text-link" onClick={() => setMessage('Email delivery is not connected yet. Use any six digits to preview the flow.')}>Didn’t receive it? Resend code</button>
        : <button type="button" className="auth-text-link" disabled={busy || cooldown > 0} onClick={async () => { if (await requestCode()) setMessage('A new code is on its way.') }}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Didn’t receive it? Resend code'}</button>)}
    </form>
  </AuthShell>
}
