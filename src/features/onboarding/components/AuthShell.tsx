import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { brandPanel } from '@/assets'
import { FixthWordmark } from '@/components/common/Logo'
export type AuthAccountType = 'student' | 'organization'
interface AuthShellProps { brand: string; children: ReactNode; story?: string; organization?: boolean; accountType?: AuthAccountType; chooser?: boolean }
export default function AuthShell({ brand, children, story, organization = false, accountType, chooser = false }: AuthShellProps) {
  const isOrganization = accountType === 'organization' || (accountType === undefined && organization)
  const signingIn = accountType !== undefined
  const signInPath = isOrganization ? '/auth/organization/sign-in' : '/auth/student/sign-in'
  const signUpPath = isOrganization ? '/onboarding/organization/email' : '/onboarding/student/email'
  const switchTarget = signingIn ? signUpPath : signInPath
  const switchLabel = signingIn ? 'Create account' : 'Sign in'
  const switchLink = chooser ? null : <Link to={switchTarget}>{switchLabel}</Link>
  return <div className="auth-page"><a className="auth-skip" href="#auth-content">Skip to content</a><div className="auth-card">
    <div className="auth-mobile-banner"><Link to="/" aria-label="Fixth home"><FixthWordmark className="h-[29px] w-auto text-white" /></Link>{switchLink}</div>
    <aside className="auth-brand" aria-label={chooser ? 'Account access' : isOrganization ? 'For organizations' : 'For students'}>
      {story ? <><picture><source media="(min-width: 901px)" srcSet={brandPanel} /><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" className="auth-brand-artwork" /></picture><Link to="/" aria-label="Fixth home" className="auth-brand-logo"><FixthWordmark className="h-9 w-auto text-white" /></Link><div className="auth-story"><p>{chooser ? 'Welcome back' : isOrganization ? 'For organizations' : 'Build your student profile'}</p><h2>{story}</h2></div></> : <img src={brand} alt="" className="auth-brand-image" />}
    </aside>
    <div className="auth-panel"><header className="auth-header"><Link to="/" aria-label="Fixth home"><FixthWordmark className="h-9 w-auto text-brand sm:h-11" /></Link>{switchLink && <Link to={switchTarget} className="auth-secondary-link">{switchLabel}</Link>}</header><main id="auth-content" tabIndex={-1} className="auth-content">{children}</main><footer className="auth-footer">© 2026 Fixth. All rights reserved.</footer></div>
  </div></div>
}
