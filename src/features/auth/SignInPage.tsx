import { Field, ValidatedForm } from '@/features/product/components/Form'
import { useState } from 'react'
import { Link } from 'react-router'
import AuthShell from '@/features/onboarding/components/AuthShell'
import PrimaryButton from '@/features/onboarding/components/PrimaryButton'
export default function SignInPage({ reset = false }: { reset?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  return <AuthShell brand="" story={reset ? 'Let’s get you back to your opportunities.' : 'Sign in and keep moving toward your next opportunity.'}>
    <ValidatedForm key={String(reset)} className="onboarding-form" onSubmit={e => { e.preventDefault(); setMessage(reset ? 'Password reset delivery requires the Fixth API connection. No email has been sent.' : 'Sign-in is not connected to the Fixth API yet. You can explore a sample workspace below.') }}>
      <p className="auth-eyebrow">Student account</p><h1>{reset ? 'Reset your password' : 'Welcome back'}</h1><p>{reset ? 'Enter the email linked to your student account. We’ll send you a secure password reset link.' : 'Sign in to continue to your student dashboard.'}</p>
      <Field className="auth-field"><span>{reset ? 'Email address' : 'Student email address'}</span><input name="email" type="email" required autoComplete="email" /></Field>
      {!reset && <><Field className="auth-field"><span>Password</span><input name="password" type={visible ? 'text' : 'password'} required autoComplete="current-password" /></Field><div className="flex flex-wrap justify-between gap-3 text-sm text-brand"><button type="button" className="min-h-10" onClick={() => setVisible(!visible)}>{visible ? 'Hide password' : 'Show password'}</button><Link className="inline-flex min-h-10 items-center" to="/auth/forgot-password" onClick={() => setMessage('')}>Forgot password?</Link></div></>}
      <p className="auth-note">{reset ? 'We’ll only use this email to send your secure reset link.' : <>New to Fixth? <Link to="/onboarding/student/email" className="text-brand">Create your student account.</Link></>}</p>
      <p role="status">{message}</p><div className="auth-actions"><PrimaryButton type="submit">{reset ? 'Send reset link' : 'Sign in'}</PrimaryButton></div>{reset ? <Link to="/auth/sign-in" onClick={() => setMessage('')} className="auth-text-link">Back to sign in</Link> : <Link to="/workspaces" className="auth-text-link">Explore a sample workspace →</Link>}
    </ValidatedForm>
  </AuthShell>
}

