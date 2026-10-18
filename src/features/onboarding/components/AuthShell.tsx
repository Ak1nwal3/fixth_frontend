import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { brandPanel } from '@/assets'
import { FixthWordmark } from '@/components/common/Logo'
interface AuthShellProps { brand: string; children: ReactNode; story?: string; organization?: boolean }
export default function AuthShell({ brand, children, story, organization = false }: AuthShellProps) {
  const signingIn = useLocation().pathname === '/auth/sign-in'
  return <div className="auth-page"><a className="auth-skip" href="#auth-content">Skip to content</a><div className="auth-card">
    <div className="auth-mobile-banner"><Link to="/" aria-label="Fixth home"><FixthWordmark className="h-[29px] w-auto text-white" /></Link><Link to={signingIn ? '/onboarding/student/email' : '/auth/sign-in'}>{signingIn ? 'Create account' : 'Sign in'}</Link></div>
    <aside className="auth-brand" aria-label={organization ? 'For organizations' : 'For students'}>
      {story ? <><picture><source media="(min-width: 901px)" srcSet={brandPanel} /><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" className="auth-brand-artwork" /></picture><Link to="/" aria-label="Fixth home" className="auth-brand-logo"><FixthWordmark className="h-9 w-auto text-white" /></Link><div className="auth-story"><p>{organization ? 'For organizations' : 'Build your student profile'}</p><h2>{story}</h2></div></> : <img src={brand} alt="" className="auth-brand-image" />}
    </aside>
    <div className="auth-panel"><header className="auth-header"><Link to="/" aria-label="Fixth home"><FixthWordmark className="h-9 w-auto text-brand sm:h-11" /></Link><Link to={signingIn ? '/onboarding/student/email' : '/auth/sign-in'} className="auth-secondary-link">{signingIn ? 'Create account' : 'Sign in'}</Link></header><main id="auth-content" tabIndex={-1} className="auth-content">{children}</main><footer className="auth-footer">© 2026 Fixth. All rights reserved.</footer></div>
  </div></div>
}
