import { useState, type SubmitEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import AuthShell, { type AuthAccountType } from '@/features/onboarding/components/AuthShell'
import PrimaryButton from '@/features/onboarding/components/PrimaryButton'
import { Field, ValidatedForm } from '@/features/product/components/Form'
import { passwordError } from '@/lib/password'
import { confirmPasswordReset } from '@/services/auth'
import { ApiError } from '@/services/http'
import { apiErrorMessage } from '@/services/types'

/**
 * Consumes the `/reset-password?uid=<uid>&token=<token>` links the backend
 * emails, and posts the new password to the matching role's confirm endpoint.
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const uid = params.get('uid') || ''
  const token = params.get('token') || ''
  const [accountType, setAccountType] = useState<AuthAccountType>('student')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  const organization = accountType === 'organization'
  const signInPath = organization ? '/auth/organization/sign-in' : '/auth/student/sign-in'

  if (!uid || !token) {
    return (
      <AuthShell brand="" accountType="student" story="Let’s get you back to your opportunities.">
        <div className="onboarding-form">
          <h1>Invalid reset link</h1>
          <p>This password reset link is missing required parameters. Request a new reset link.</p>
          <Link className="auth-text-link" to="/auth/student/forgot-password">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    )
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const error = passwordError(password) || (password !== confirm ? 'Passwords do not match.' : '')
    if (error) {
      setMessage(error)
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await confirmPasswordReset(organization ? 'organization' : 'student', {
        uid,
        token,
        new_password: password,
      })
      setDone(true)
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(apiErrorMessage(error.body, 'This reset link is invalid or has expired.'))
      } else {
        setMessage('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell brand="" accountType={accountType} story="Let’s get you back to your opportunities.">
      <ValidatedForm className="onboarding-form" onSubmit={submit}>
        <p className="auth-eyebrow">{organization ? 'Organization account' : 'Student account'}</p>
        <h1>Choose a new password</h1>
        {done ? (
          <>
            <p>Your password has been reset. You can now sign in with your new password.</p>
            <div className="auth-actions">
              <Link className="auth-secondary-link" to={signInPath}>
                Continue to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <p>Enter a new password for your account. The reset link can only be used once.</p>
            <div className="flex flex-wrap gap-3 text-sm text-brand" role="group" aria-label="Account type">
              <button type="button" className="min-h-10" aria-pressed={!organization} onClick={() => setAccountType('student')}>
                Student
              </button>
              <button type="button" className="min-h-10" aria-pressed={organization} onClick={() => setAccountType('organization')}>
                Organization
              </button>
            </div>
            <Field className="auth-field">
              <span>New password</span>
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setMessage('')
                }}
              />
            </Field>
            <Field className="auth-field">
              <span>Confirm new password</span>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={e => {
                  setConfirm(e.target.value)
                  setMessage('')
                }}
              />
            </Field>
            <p role="alert" className="auth-field-error">{message}</p>
            <div className="auth-actions">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? 'Resetting…' : 'Reset password'}
              </PrimaryButton>
            </div>
            <Link to={signInPath} className="auth-text-link">Back to sign in</Link>
          </>
        )}
      </ValidatedForm>
    </AuthShell>
  )
}
