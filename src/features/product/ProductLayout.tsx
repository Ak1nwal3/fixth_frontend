import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Search, FileText, Bookmark, User, Building2, ShieldCheck, List, Users, LogOut, ScrollText } from 'lucide-react'
import { FixthWordmark } from '@/components/common/Logo'
import { initials } from './data'
import { useAuth } from '@/features/auth/useAuth'
import { useOptionalStudentData } from './useStudentData'
import { getCompanyProfile, type CompanyProfile as CompanyProfileData } from '@/services/companies'
import { Avatar } from './components/ui'
const studentNav = [{ to: '/student/discover', label: 'Discover', icon: Search }, { to: '/student/applications', label: 'Applications', icon: FileText }, { to: '/student/saved', label: 'Saved', icon: Bookmark }, { to: '/student/profile', label: 'Profile', icon: User }]
const companyNav = [{ to: '/company/placements', label: 'Placements', icon: Building2 }, { to: '/company/applicants', label: 'Applicants', icon: Users }, { to: '/company/profile', label: 'Company profile', icon: User }]
const adminNav = [{ to: '/admin/verification', label: 'Verification', icon: ShieldCheck }, { to: '/admin/listings', label: 'Listings', icon: List }, { to: '/admin/accounts', label: 'Accounts', icon: Users }, { to: '/admin/audit', label: 'Audit log', icon: ScrollText }]
export default function ProductLayout({ role }: { role: 'student' | 'company' | 'admin' }) {
  const { user, signOut } = useAuth()
  const studentData = useOptionalStudentData()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [company, setCompany] = useState<CompanyProfileData | null>(null)

  useEffect(() => {
    if (role !== 'company' || !user) {
      setCompany(null)
      return
    }
    let live = true
    getCompanyProfile()
      .then(profile => {
        if (live) setCompany(profile)
      })
      .catch(() => {
        // Header falls back to the account name when the profile is unavailable.
        if (live) setCompany(null)
      })
    return () => {
      live = false
    }
  }, [role, user])

  const nav = role === 'student' ? studentNav : role === 'company' ? companyNav : adminNav
  const studentName = user?.full_name || 'Student'
  const name = role === 'student' ? studentName : role === 'company' ? company?.name || user?.full_name || 'Organization' : 'Fixth Admin'
  const segment = pathname.split('/')[2]
  const titles: Record<string, string> = { discover: 'Find a placement that fits', saved: 'Your saved placements', applications: 'Track your applications', profile: role === 'company' ? 'Your company profile' : 'Your student profile', resume: 'Manage your resume', placements: pathname.includes('/new') ? 'Create a placement' : pathname.endsWith('/edit') ? 'Edit placement' : role === 'student' ? 'Placement details' : 'Manage your placements', applicants: pathname.split('/').length > 3 ? 'Review applicant' : 'Listing applicants', verification: pathname.split('/').length > 3 ? 'Verification review' : 'Verification queue', listings: 'Placement moderation', accounts: 'Account safety', audit: 'Audit log' }
  const title = pathname.startsWith('/p/') ? 'Placement details' : titles[segment] || 'Placement details'
  useEffect(() => { document.title = `${title} · Fixth`; document.getElementById('product-main')?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [pathname, title])
  const profileStrength = studentData?.profile?.profileStrength ?? null
  const handleSignOut = async () => {
    await signOut()
    navigate(role === 'company' ? '/auth/organization/sign-in' : '/auth/student/sign-in')
  }
  return <div className={`product-app ${role}`}>
    <a className="p-skip" href="#product-main">Skip to content</a>
    <aside className="p-sidebar"><Link to="/" className="p-logo" aria-label="Fixth home"><FixthWordmark className="h-[34px] w-auto" /></Link>
      {role !== 'student' && <div className="p-account"><Avatar fallback={role === 'company' ? initials(name) : 'FA'} src={role === 'company' ? company?.logo?.url ?? null : null} /><div><strong>{role === 'company' ? name : 'Trust & Safety'}</strong><small>{role === 'company' ? 'Organization account' : 'Fixth admin'}</small></div></div>}
      <nav aria-label={`${role} navigation`}>{nav.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to}><Icon size={17} aria-hidden />{label}</NavLink>)}</nav>
      <div className="p-sidebar-bottom"><div className="p-sidebar-note">{role === 'student' ? (profileStrength != null ? <><strong>Profile progress</strong><span>{profileStrength}%</span><progress aria-label="Profile completion" max={100} value={profileStrength} /></> : <><strong>Student workspace</strong><p>Live placement data from the Fixth API.</p></>) : role === 'company' ? <><strong>Organization workspace</strong><p>Manage placements and applicants with live Fixth data.</p></> : <><ShieldCheck size={15} aria-hidden /> All systems operational</>}</div>{role === 'admin' ? <Link to="/"><LogOut size={16} aria-hidden />Sign out of preview</Link> : <button type="button" onClick={handleSignOut}><LogOut size={16} aria-hidden />Sign out</button>}</div>
    </aside>
    <div className="p-workspace"><header className="p-header"><div><Link to="/" className="p-mobile-logo" aria-label="Fixth home"><FixthWordmark className="h-[29px] w-auto" /></Link><p className="p-eyebrow">{role === 'student' ? 'Student placements' : role === 'company' ? 'Organization workspace' : 'Trust & safety'}</p><h1><span className="p-desktop-title">{title}</span><span className="p-mobile-title">{role === 'student' && segment === 'discover' ? 'Discover placements' : title}</span></h1><p>{role === 'student' ? 'Verified opportunities matched to your discipline and profile.' : role === 'company' ? 'Publish verified opportunities and move the right applicants forward.' : 'Review requests and keep the Fixth marketplace safe.'}</p></div>{role === 'admin' ? <div className="p-header-user"><Avatar fallback={initials(name)} /><span>{name}</span></div> : role === 'student' && !user ? <Link className="p-header-user" to="/auth/student/sign-in" aria-label="Sign in to your student account"><Avatar fallback="·" /><span>Sign in</span></Link> : <Link className="p-header-user" to={role === 'company' ? '/company/profile' : '/student/profile'} aria-label={`Open profile: ${name}`}><Avatar src={role === 'student' ? studentData?.profile?.photo?.url ?? null : role === 'company' ? company?.logo?.url ?? null : null} fallback={initials(name)} /><span>{name}</span></Link>}</header>
      <main id="product-main" className="p-main" tabIndex={-1}><Outlet /></main>
      {role === 'admin' && <footer className="p-preview">Sample admin workspace · Changes stay in this browser session. <Link to="/workspaces">Switch workspace</Link></footer>}
    </div>
    <nav className="p-mobile-nav" aria-label={`${role} mobile navigation`}>{nav.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to}><Icon size={19} aria-hidden /><span>{label}</span></NavLink>)}</nav>
  </div>
}
