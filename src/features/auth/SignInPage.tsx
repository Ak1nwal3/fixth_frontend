import { Field, ValidatedForm } from '@/features/product/components/Form'
import { useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import AuthShell, { type AuthAccountType } from '@/features/onboarding/components/AuthShell'
import PrimaryButton from '@/features/onboarding/components/PrimaryButton'
import { useAuth } from './useAuth'
import { requestPasswordReset } from '@/services/auth'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'

export default function SignInPage({ reset = false, accountType = 'student' }: { reset?: boolean; accountType?: AuthAccountType }) {
  const organization = accountType === 'organization'
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const signInPath = organization ? '/auth/organization/sign-in' : '/auth/student/sign-in'
  const signUpPath = organization ? '/onboarding/organization/email' : '/onboarding/student/email'
  const forgotPath = organization ? '/auth/organization/forgot-password' : '/auth/student/forgot-password'
  const story = reset
    ? organization ? 'Let’s get you back to your organization.' : 'Let’s get you back to your opportunities.'
    : organization ? 'Sign in to manage your organization and placements.' : 'Sign in and keep moving toward your next opportunity.'

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    if (reset) {
      if (organization) {
        setMessage('Organization password reset is not connected yet. Contact support to regain access.')
        return
      }
      setBusy(true)
      setMessage('')
      try {
        // Always 202 with a generic message; never reveals whether the account exists.
        const response = await requestPasswordReset('student', email)
        setMessage(response.detail)
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          setMessage('Too many attempts. Please wait a minute and try again.')
        } else if (error instanceof ApiError) {
          setMessage(apiErrorMessage(error.body, 'Could not send the reset link. Please try again.'))
        } else {
          setMessage('Could not reach the server. Check your connection and try again.')
        }
      } finally {
        setBusy(false)
      }
      return
    }
    if (organization) {
      setMessage('Organization sign-in is not connected to the Fixth API yet. You can explore a sample workspace below.')
      return
    }
    const password = String(new FormData(event.currentTarget).get('password') || '')
    setBusy(true)
    setMessage('')
    try {
      await signIn('student', email, password)
      navigate(from && from.startsWith('/student') ? from : '/student/discover', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) setMessage('Invalid email or password.')
        else if (error.status === 429) setMessage('Too many attempts. Please wait a minute and try again.')
        else setMessage(apiErrorMessage(error.body, 'Sign-in failed. Please try again.'))
      } else {
        setMessage('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return <AuthShell brand="" accountType={accountType} story={story}>
    <ValidatedForm key={`${accountType}-${reset}`} className="onboarding-form" onSubmit={submit}>
      <p className="auth-eyebrow">{organization ? 'Organization account' : 'Student account'}</p><h1>{reset ? 'Reset your password' : 'Welcome back'}</h1><p>{reset ? (organization ? 'Enter the work email linked to your organization account. We’ll send you a secure password reset link.' : 'Enter the email linked to your student account. We’ll send you a secure password reset link.') : (organization ? 'Sign in to manage your organization’s placements and applicants.' : 'Sign in to continue to your student dashboard.')}</p>
      <Field className="auth-field"><span>{reset ? 'Email address' : organization ? 'Work email address' : 'Student email address'}</span><input name="email" type="email" required autoComplete="email" /></Field>
      {!reset && <><Field className="auth-field"><span>Password</span><input name="password" type={visible ? 'text' : 'password'} required autoComplete="current-password" /></Field><div className="flex flex-wrap justify-between gap-3 text-sm text-brand"><button type="button" className="min-h-10" onClick={() => setVisible(!visible)}>{visible ? 'Hide password' : 'Show password'}</button><Link className="inline-flex min-h-10 items-center" to={forgotPath} onClick={() => setMessage('')}>Forgot password?</Link></div></>}
      <p className="auth-note">{reset ? 'We’ll only use this email to send your secure reset link.' : <>New to Fixth? <Link to={signUpPath} className="text-brand">Create your {organization ? 'organization' : 'student'} account.</Link></>}</p>
      <p role="status">{message}</p><div className="auth-actions"><PrimaryButton type="submit" disabled={busy}>{busy ? (reset ? 'Sending…' : 'Signing in…') : reset ? 'Send reset link' : 'Sign in'}</PrimaryButton></div>{reset ? <Link to={signInPath} onClick={() => setMessage('')} className="auth-text-link">Back to sign in</Link> : organization ? <Link to="/company/placements" className="auth-text-link">Explore a sample organization workspace →</Link> : null}
    </ValidatedForm>
  </AuthShell>
}
