import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Search, FileText, Bookmark, User, Building2, ShieldCheck, List, Users, LogOut, ScrollText } from 'lucide-react'
import { FixthWordmark } from '@/components/common/Logo'
import { initials, profileStrength } from './data'
import { useProduct } from './useProduct'
const studentNav = [{ to: '/student/discover', label: 'Discover', icon: Search }, { to: '/student/applications', label: 'Applications', icon: FileText }, { to: '/student/saved', label: 'Saved', icon: Bookmark }, { to: '/student/profile', label: 'Profile', icon: User }]
const companyNav = [{ to: '/company/placements', label: 'Placements', icon: Building2 }, { to: '/company/applicants', label: 'Applicants', icon: Users }, { to: '/company/profile', label: 'Company profile', icon: User }]
const adminNav = [{ to: '/admin/verification', label: 'Verification', icon: ShieldCheck }, { to: '/admin/listings', label: 'Listings', icon: List }, { to: '/admin/accounts', label: 'Accounts', icon: Users }, { to: '/admin/audit', label: 'Audit log', icon: ScrollText }]
export default function ProductLayout({ role }: { role: 'student' | 'company' | 'admin' }) {
  const { state } = useProduct()
  const { pathname } = useLocation()
  const nav = role === 'student' ? studentNav : role === 'company' ? companyNav : adminNav
  const name = role === 'student' ? `${state.profile.firstName} ${state.profile.lastName}`.trim() || 'Your profile' : role === 'company' ? 'Bola Okafor' : 'Fixth Admin'
  const segment = pathname.split('/')[2]
  const titles: Record<string, string> = { discover: 'Find a placement that fits', saved: 'Your saved placements', applications: 'Track your applications', profile: role === 'company' ? 'Your company profile' : 'Your student profile', resume: 'Manage your resume', placements: pathname.includes('/new') ? 'Create a placement' : pathname.endsWith('/edit') ? 'Edit placement' : role === 'student' ? 'Placement details' : 'Manage your placements', applicants: pathname.split('/').length > 3 ? 'Review applicant' : 'Listing applicants', verification: pathname.split('/').length > 3 ? 'Verification review' : 'Verification queue', listings: 'Placement moderation', accounts: 'Account safety', audit: 'Audit log' }
  const title = pathname.startsWith('/p/') ? 'Placement details' : titles[segment] || 'Placement details'
  useEffect(() => { document.title = `${title} · Fixth`; document.getElementById('product-main')?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [pathname, title])
  return <div className={`product-app ${role}`}>
    <a className="p-skip" href="#product-main">Skip to content</a>
    <aside className="p-sidebar"><Link to="/" className="p-logo" aria-label="Fixth home"><FixthWordmark className="h-[34px] w-auto" /></Link>
      {role !== 'student' && <div className="p-account"><span className="p-avatar">{role === 'company' ? 'N' : 'FA'}</span><div><strong>{role === 'company' ? 'Nova Labs' : 'Trust & Safety'}</strong><small>{role === 'company' ? 'Company account' : 'Fixth admin'}</small></div></div>}
      <nav aria-label={`${role} navigation`}>{nav.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to}><Icon size={17} aria-hidden />{label}</NavLink>)}</nav>
      <div className="p-sidebar-bottom"><div className="p-sidebar-note">{role === 'student' ? <><strong>Profile progress</strong><span>{profileStrength(state.profile)}%</span><progress aria-label="Profile completion" max={100} value={profileStrength(state.profile)} /></> : role === 'company' ? <><strong>Application digest</strong><p>{state.candidates.filter(c => c.status === 'Submitted').length} new applicants</p></> : <><ShieldCheck size={15} aria-hidden /> All systems operational</>}</div><Link to="/auth/sign-in"><LogOut size={16} aria-hidden />Sign out of preview</Link></div>
    </aside>
    <div className="p-workspace"><header className="p-header"><div><Link to="/" className="p-mobile-logo" aria-label="Fixth home"><FixthWordmark className="h-[29px] w-auto" /></Link><p className="p-eyebrow">{role === 'student' ? 'Student placements' : role === 'company' ? 'Verified company' : 'Trust & safety'}</p><h1><span className="p-desktop-title">{title}</span><span className="p-mobile-title">{role === 'student' && segment === 'discover' ? 'Discover placements' : title}</span></h1><p>{role === 'student' ? 'Verified opportunities matched to your discipline and profile.' : role === 'company' ? 'Publish verified opportunities and move the right applicants forward.' : 'Review requests and keep the Fixth marketplace safe.'}</p></div><div className="p-header-user"><span className="p-avatar">{initials(name)}</span><span>{name}</span></div></header>
      <main id="product-main" className="p-main" tabIndex={-1}><Outlet /></main>
      <footer className="p-preview">Sample workspace · Changes stay in this browser session. <Link to="/workspaces">Switch workspace</Link></footer>
    </div>
    <nav className="p-mobile-nav" aria-label={`${role} mobile navigation`}>{nav.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to}><Icon size={19} aria-hidden /><span>{label}</span></NavLink>)}</nav>
  </div>
}




