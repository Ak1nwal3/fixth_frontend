import { useState, type ReactNode } from 'react'
import { ProductContext } from './useProduct'
import { initialPlacements, initialCandidates, initialProfile, initialApplications, type Placement, type Candidate, type Profile, type Application, type ApplicationStatus } from './data'
export interface AuditEntry { id: string; action: string; subject: string; reason: string; date: string }
interface State {
  placements: Placement[]; candidates: Candidate[]; profile: Profile; applications: Application[]; saved: string[];
  suspended: string[]; companyVerification: string; audit: AuditEntry[]; deleted: boolean
}
const initial: State = { placements: initialPlacements, candidates: initialCandidates, profile: initialProfile, applications: initialApplications, saved: [], suspended: [], companyVerification: 'Pending', audit: [], deleted: false }
function load(): State {
  try {
    const value = JSON.parse(sessionStorage.getItem('fixth-product-preview') || 'null')
    if (value?.version === 1 && Array.isArray(value.state?.placements) && value.state.profile) return { ...initial, ...value.state }
  } catch { /* A blocked or outdated storage entry must not prevent rendering. */ }
  return initial
}
export interface Store {
  state: State; updateProfile: (profile: Profile) => void; toggleSaved: (id: string) => void;
  apply: (id: string) => void; savePlacement: (placement: Placement) => void;
  candidateStatus: (id: string, status: ApplicationStatus) => void;
  moderate: (action: string, subject: string, reason: string) => void;
  deleteProfile: () => void; resumeFile: File | null; setResumeFile: (file: File | null) => void;
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const change = (fn: (current: State) => State) => setState(current => {
    const next = fn(current)
    try { sessionStorage.setItem('fixth-product-preview', JSON.stringify({ version: 1, state: next })) } catch { /* In-memory interactions still work. */ }
    return next
  })
  const value: Store = {
    state, resumeFile, setResumeFile,
    updateProfile: profile => change(s => ({ ...s, profile, deleted: false })),
    toggleSaved: id => change(s => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter(value => value !== id) : [...s.saved, id] })),
    apply: id => change(s => s.applications.some(a => a.placementId === id) ? s : ({ ...s, applications: [{ id: crypto.randomUUID(), placementId: id, status: 'Submitted', date: new Date().toISOString() }, ...s.applications] })),
    savePlacement: placement => change(s => ({ ...s, placements: s.placements.some(p => p.id === placement.id) ? s.placements.map(p => p.id === placement.id ? placement : p) : [...s.placements, placement] })),
    candidateStatus: (id, status) => change(s => ({ ...s, candidates: s.candidates.map(c => c.id === id ? { ...c, status } : c), applications: id === 'c-1' ? s.applications.map(a => a.placementId === 'pl-6' ? { ...a, status } : a) : s.applications })),
    moderate: (action, subject, reason) => change(s => ({ ...s,
      audit: [{ id: crypto.randomUUID(), action, subject, reason, date: new Date().toISOString() }, ...s.audit],
      candidates: s.candidates.map(c => c.id === subject && (action === 'Approve verification' || action === 'Reject verification') ? { ...c, verification: action === 'Approve verification' ? 'Verified' : 'Rejected' } : c),
      companyVerification: subject === 'nova' ? (action === 'Approve verification' ? 'Verified' : action === 'Reject verification' ? 'Rejected' : s.companyVerification) : s.companyVerification,
      placements: s.placements.map(p => p.id === subject ? { ...p, status: action === 'Unpublish listing' ? 'Unpublished' : action === 'Restore listing' ? 'Active' : p.status } : p),
      suspended: action === 'Suspend account' ? [...new Set([...s.suspended, subject])] : action === 'Restore account' ? s.suspended.filter(id => id !== subject) : s.suspended,
    })),
    deleteProfile: () => { setResumeFile(null); change(s => ({ ...s, deleted: true, profile: { ...initialProfile, firstName: '', lastName: '', email: '', phone: '', location: '', institution: '', discipline: '', studentId: '', skills: '', interests: '', resume: '', portfolio: '' }, saved: [], applications: [] })); try { sessionStorage.removeItem('fixth-onboarding-student') } catch { /* Storage may be unavailable. */ } },
  }
  return <ProductContext value={value}>{children}</ProductContext>
}


