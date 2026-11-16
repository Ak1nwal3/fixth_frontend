import { Field, ValidatedForm } from '@/features/product/components/Form'
import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import AuthShell, { type AuthAccountType } from '@/features/onboarding/components/AuthShell'
import PrimaryButton from '@/features/onboarding/components/PrimaryButton'
import PasswordInput from '@/components/common/PasswordInput'
import { useAuth } from './useAuth'
import { requestPasswordReset } from '@/services/auth'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'
import { roleLabel } from './roles'

export default function SignInPage({ reset = false, accountType = 'student' }: { reset?: boolean; accountType?: AuthAccountType }) {
  const organization = accountType === 'organization'
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'error' | 'status'>('error')
  const { signIn, status, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const signInPath = organization ? '/auth/organization/sign-in' : '/auth/student/sign-in'
  const signUpPath = organization ? '/onboarding/organization/email' : '/onboarding/student/email'
  const forgotPath = organization ? '/auth/organization/forgot-password' : '/auth/student/forgot-password'
  const home = organization ? '/company/placements' : '/student/discover'
  const prefix = organization ? '/company' : '/student'
  const destination = from && from.startsWith(prefix) ? from : home
  const pageRole = organization ? 'company' : 'student'
  const otherAccount = status === 'signed-in' && user && user.role !== pageRole ? user : null
  /** Errors render as a red banner; confirmations as a green one. */
  const show = (text: string, nextTone: 'error' | 'status' = 'error') => {
    setMessage(text)
    setTone(nextTone)
  }
  const story = reset
    ? organization ? 'Let’s get you back to your organization.' : 'Let’s get you back to your opportunities.'
    : organization ? 'Sign in to manage your organization and placements.' : 'Sign in and keep moving toward your next opportunity.'

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    if (reset) {
      setBusy(true)
      setMessage('')
      try {
        // Always 202 with a generic message; never reveals whether the account exists.
        const response = await requestPasswordReset(organization ? 'organization' : 'student', email)
        show(response.detail, 'status')
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          show('Too many attempts. Please wait a minute and try again.')
        } else if (error instanceof ApiError) {
          show(apiErrorMessage(error.body, 'Could not send the reset link. Please try again.'))
        } else {
          show('Could not reach the server. Check your connection and try again.')
        }
      } finally {
        setBusy(false)
      }
      return
    }
    const password = String(new FormData(event.currentTarget).get('password') || '')
    setBusy(true)
    setMessage('')
    try {
      await signIn(organization ? 'organization' : 'student', email, password)
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          show(
            organization
              ? 'Incorrect email or password. Check both and try again. If you never set a password, use “Forgot password” to create one.'
              : 'Incorrect email or password. Check both and try again. Student accounts sign in with their .edu.ng email.',
          )
        } else if (error.status === 429) show('Too many attempts. Please wait a minute and try again.')
        else if (error.status === 403) {
          show(apiErrorMessage(error.body, 'This account cannot sign in yet.'))
        } else if (error.status >= 500) show('Fixth is having trouble right now. Please try again in a moment.')
        else show(apiErrorMessage(error.body, 'Sign-in failed. Please try again.'))
      } else {
        show('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  // Already signed in with this account type: go straight to the workspace.
  if (!reset && status === 'signed-in' && user?.role === pageRole) return <Navigate to={destination} replace />

  return <AuthShell brand="" accountType={accountType} story={story}>
    <ValidatedForm key={`${accountType}-${reset}`} className="onboarding-form" onSubmit={submit}>
      <p className="auth-eyebrow">{organization ? 'Organization account' : 'Student account'}</p><h1>{reset ? 'Reset your password' : 'Welcome back'}</h1><p>{reset ? (organization ? 'Enter the work email linked to your organization account. We’ll send you a secure password reset link.' : 'Enter the email linked to your student account. We’ll send you a secure password reset link.') : (organization ? 'Sign in to manage your organization’s placements and applicants.' : 'Sign in to continue to your student dashboard.')}</p>
      <Field className="auth-field"><span>{reset ? 'Email address' : organization ? 'Work email address' : 'Student email address'}</span><input name="email" type="email" required autoComplete="email" /></Field>
      {!reset && <><Field className="auth-field"><span>Password</span><PasswordInput name="password" required autoComplete="current-password" /></Field><div className="flex flex-wrap justify-end gap-3 text-sm text-brand"><Link className="inline-flex min-h-10 items-center" to={forgotPath} onClick={() => setMessage('')}>Forgot password?</Link></div></>}
      <p className="auth-note">{reset ? 'We’ll only use this email to send your secure reset link.' : <>New to Fixth? <Link to={signUpPath} className="text-brand">Create your {organization ? 'organization' : 'student'} account.</Link></>}</p>
      {otherAccount && !reset && <p className="auth-alert" data-tone="info"><Info size={16} aria-hidden /><span>You’re signed in as {/^[aeiou]/.test(roleLabel(otherAccount.role)) ? 'an' : 'a'} {roleLabel(otherAccount.role)} ({otherAccount.email}). Signing in here will sign you out of that account.</span></p>}
      {message && <p role={tone === 'error' ? 'alert' : 'status'} className="auth-alert" data-tone={tone}>{tone === 'error' ? <AlertTriangle size={16} aria-hidden /> : <CheckCircle2 size={16} aria-hidden />}<span>{message}</span></p>}<div className="auth-actions"><PrimaryButton type="submit" disabled={busy}>{busy ? (reset ? 'Sending…' : 'Signing in…') : reset ? 'Send reset link' : 'Sign in'}</PrimaryButton></div>{reset ? <Link to={signInPath} onClick={() => setMessage('')} className="auth-text-link">Back to sign in</Link> : null}
    </ValidatedForm>
  </AuthShell>
}
