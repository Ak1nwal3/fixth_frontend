import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Building2, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { ApiError } from '@/services/http'
import { updateMe } from '@/services/auth'
import {
  clearCompanyLogo,
  getCompanyProfile,
  updateCompanyProfile,
  type CompanyProfile as CompanyProfileData,
} from '@/services/companies'
import { apiErrorMessage } from '@/services/types'
import { Avatar, Badge, Panel } from './components/ui'

function messageFor(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 400) return apiErrorMessage(error.body, fallback)
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.'
    return apiErrorMessage(error.body, fallback)
  }
  return 'Could not reach the server. Check your connection and try again.'
}

const LOGO_TYPES = 'image/jpeg,image/png,image/webp'
const MAX_LOGO_BYTES = 5 * 1024 * 1024

interface CompanyForm {
  name: string
  website: string
  industry: string
  description: string
  country: string
  city: string
  address: string
  registrationNumber: string
  primaryContactName: string
  primaryContactTitle: string
}

function companyToForm(company: CompanyProfileData): CompanyForm {
  return {
    name: company.name,
    website: company.website,
    industry: company.industry,
    description: company.description,
    country: company.country,
    city: company.city,
    address: company.address,
    registrationNumber: company.registrationNumber,
    primaryContactName: company.primaryContactName,
    primaryContactTitle: company.primaryContactTitle,
  }
}

export function CompanyProfilePage() {
  const { user, refreshUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameMessage, setNameMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [signOutBusy, setSignOutBusy] = useState(false)

  const [company, setCompany] = useState<CompanyProfileData | null>(null)
  const [companyStatus, setCompanyStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading')
  const [companyLoadError, setCompanyLoadError] = useState('')
  const [form, setForm] = useState<CompanyForm | null>(null)
  const [companyBusy, setCompanyBusy] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [companyNotice, setCompanyNotice] = useState<{ text: string; error: boolean } | null>(null)

  useEffect(() => {
    // Sign-in returns the base user shape; `/auth/organization/me/` adds company_id.
    void refreshUser().catch(() => undefined)
  }, [refreshUser])

  useEffect(() => {
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name || '')
  }, [user?.first_name, user?.last_name])

  const loadCompany = () => {
    setCompanyStatus('loading')
    setCompanyLoadError('')
    getCompanyProfile()
      .then(data => {
        setCompany(data)
        setForm(companyToForm(data))
        setCompanyStatus('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 403) {
          setCompanyStatus('unavailable')
          return
        }
        setCompanyStatus('error')
        setCompanyLoadError(messageFor(error, 'Company details could not be loaded.'))
      })
  }

  useEffect(loadCompany, [])

  const notify = (text: string, error = false) => setCompanyNotice({ text, error })

  const saveCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setCompanyBusy(true)
    setCompanyNotice(null)
    try {
      const updated = await updateCompanyProfile({
        name: form.name.trim(),
        website: form.website.trim(),
        industry: form.industry.trim(),
        description: form.description.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        registrationNumber: form.registrationNumber.trim(),
        primaryContactName: form.primaryContactName.trim(),
        primaryContactTitle: form.primaryContactTitle.trim(),
      })
      setCompany(updated)
      setForm(companyToForm(updated))
      notify('Company details updated.')
    } catch (error) {
      notify(messageFor(error, 'Company details could not be updated.'), true)
    } finally {
      setCompanyBusy(false)
    }
  }

  const onLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      notify('The logo is too large. Use a file up to 5 MB.', true)
      return
    }
    setLogoBusy(true)
    setCompanyNotice(null)
    try {
      const updated = await updateCompanyProfile({}, file)
      setCompany(updated)
      setForm(companyToForm(updated))
      notify('Logo updated.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 413) {
        notify('The logo is too large. Use a file up to 5 MB and 4096 px.', true)
      } else if (error instanceof ApiError && error.status === 415) {
        notify('Upload a JPEG, PNG, or WebP logo.', true)
      } else {
        notify(messageFor(error, 'The logo could not be updated.'), true)
      }
    } finally {
      setLogoBusy(false)
    }
  }

  const removeLogo = async () => {
    setLogoBusy(true)
    setCompanyNotice(null)
    try {
      const updated = await clearCompanyLogo()
      setCompany(updated)
      setForm(companyToForm(updated))
      notify('Logo removed.')
    } catch (error) {
      notify(messageFor(error, 'The logo could not be removed.'), true)
    } finally {
      setLogoBusy(false)
    }
  }

  const saveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNameBusy(true)
    setNameMessage('')
    try {
      await updateMe('organization', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      await refreshUser()
      setNameMessage('Organization account name updated.')
    } catch (error) {
      setNameMessage(messageFor(error, 'Your name could not be updated.'))
    } finally {
      setNameBusy(false)
    }
  }

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage('')
    if (newPassword.length < 8) {
      setPasswordMessage('Use at least 8 characters for the new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('The new passwords do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      await updateMe('organization', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated. Use it the next time you sign in.')
    } catch (error) {
      setPasswordMessage(messageFor(error, 'Your password could not be updated.'))
    } finally {
      setPasswordBusy(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutBusy(true)
    try {
      await signOut()
    } finally {
      setSignOutBusy(false)
      navigate('/auth/organization/sign-in', { replace: true })
    }
  }

  return (
    <>
      <div className="p-between p-section-head">
        <div>
          <h2>Organization profile</h2>
          <p>Account settings and workspace access</p>
        </div>
        <Badge tone="neutral">Organization account</Badge>
      </div>
      <div className="p-columns">
        <div className="p-stack">
          <Panel>
            <div className="p-identity">
              <span className="p-avatar large">
                {(user?.full_name || user?.email || 'O').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>{user?.full_name || 'Organization account'}</h2>
                <p>{user?.email}</p>
                <p>
                  <UserRound aria-hidden size={14} className="p-inline-icon" /> Company account
                </p>
              </div>
            </div>
          </Panel>
          {companyStatus === 'loading' && (
            <Panel>
              <p role="status" className="p-small">
                Loading company details…
              </p>
            </Panel>
          )}
          {companyStatus === 'unavailable' && (
            <Panel className="tinted">
              <p className="p-small">
                No active company profile is linked to this account yet, so company details cannot
                be shown or edited. Complete organization onboarding to create a company profile.
              </p>
            </Panel>
          )}
          {companyStatus === 'error' && (
            <Panel>
              <p role="alert" className="p-error">
                {companyLoadError}
              </p>
              <button type="button" className="p-button secondary" onClick={loadCompany}>
                Try again
              </button>
            </Panel>
          )}
          {companyStatus === 'ready' && company && form && (
            <Panel>
              <h2>Company details</h2>
              <p>
                These details identify {company.name} to students and Fixth administrators. The
                logo and description appear alongside your placements.
              </p>
              <div className="p-identity">
                <Avatar className="company-mark large" src={company.logo?.url ?? null} fallback={company.name.slice(0, 1)} />
                <div>
                  <h3>{company.name}</h3>
                  <p>Public profile: /companies/{company.slug}</p>
                </div>
              </div>
              <form className="p-form" onSubmit={saveCompany}>
                <div className="p-form-grid">
                  <label className="p-field">
                    <span>Company name *</span>
                    <input
                      required
                      maxLength={150}
                      value={form.name}
                      onChange={event => setForm({ ...form, name: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Industry</span>
                    <input
                      maxLength={120}
                      value={form.industry}
                      placeholder="e.g. Technology"
                      onChange={event => setForm({ ...form, industry: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Website</span>
                    <input
                      type="url"
                      maxLength={200}
                      value={form.website}
                      onChange={event => setForm({ ...form, website: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Country</span>
                    <input
                      maxLength={100}
                      value={form.country}
                      onChange={event => setForm({ ...form, country: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>City</span>
                    <input
                      maxLength={100}
                      value={form.city}
                      onChange={event => setForm({ ...form, city: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Registration number</span>
                    <input
                      maxLength={50}
                      value={form.registrationNumber}
                      onChange={event => setForm({ ...form, registrationNumber: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Primary contact name</span>
                    <input
                      maxLength={150}
                      value={form.primaryContactName}
                      onChange={event => setForm({ ...form, primaryContactName: event.target.value })}
                    />
                  </label>
                  <label className="p-field">
                    <span>Primary contact title</span>
                    <input
                      maxLength={100}
                      value={form.primaryContactTitle}
                      onChange={event => setForm({ ...form, primaryContactTitle: event.target.value })}
                    />
                  </label>
                </div>
                <label className="p-field">
                  <span>Address</span>
                  <input
                    maxLength={255}
                    value={form.address}
                    onChange={event => setForm({ ...form, address: event.target.value })}
                  />
                </label>
                <label className="p-field">
                  <span>Description</span>
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={form.description}
                    onChange={event => setForm({ ...form, description: event.target.value })}
                  />
                </label>
                <label className="p-field">
                  <span>Logo</span>
                  <input
                    type="file"
                    accept={LOGO_TYPES}
                    disabled={logoBusy}
                    onChange={event => void onLogoSelect(event)}
                    aria-describedby="logo-note"
                  />
                  <span id="logo-note" className="p-small">
                    JPEG, PNG, or WebP · Up to 5 MB.
                  </span>
                  {company.logo && (
                    <button
                      type="button"
                      className="p-danger-link"
                      disabled={logoBusy}
                      onClick={() => void removeLogo()}
                    >
                      {logoBusy ? 'Removing…' : 'Remove logo'}
                    </button>
                  )}
                </label>
                {companyNotice && (
                  <p role="status" className={companyNotice.error ? 'p-error' : undefined}>
                    {companyNotice.text}
                  </p>
                )}
                <div className="p-actions">
                  <button type="submit" className="p-button" disabled={companyBusy || logoBusy}>
                    {companyBusy ? 'Saving…' : 'Save company details'}
                  </button>
                </div>
              </form>
            </Panel>
          )}
          <Panel>
            <h2>Account details</h2>
            <p>These details identify the person managing this organization on Fixth.</p>
            {nameMessage && (
              <p
                role="status"
                className={nameMessage === 'Organization account name updated.' ? undefined : 'p-error'}
              >
                {nameMessage}
              </p>
            )}
            <form className="p-form" onSubmit={saveName}>
              <div className="p-form-grid">
                <label className="p-field">
                  <span>First name</span>
                  <input
                    value={firstName}
                    maxLength={150}
                    autoComplete="given-name"
                    onChange={event => setFirstName(event.target.value)}
                  />
                </label>
                <label className="p-field">
                  <span>Last name</span>
                  <input
                    value={lastName}
                    maxLength={150}
                    autoComplete="family-name"
                    onChange={event => setLastName(event.target.value)}
                  />
                </label>
              </div>
              <label className="p-field">
                <span>Work email</span>
                <input value={user?.email || ''} readOnly autoComplete="email" />
              </label>
              <p className="p-small">Contact Fixth support to change the verified work email.</p>
              <div className="p-actions">
                <button type="submit" className="p-button" disabled={nameBusy}>
                  {nameBusy ? 'Saving…' : 'Save account details'}
                </button>
              </div>
            </form>
          </Panel>
          <Panel>
            <h2>Change password</h2>
            <p>
              Organization accounts created during onboarding start passwordless. Use the reset
              email link if you have not set a password yet, then update it here.
            </p>
            {passwordMessage && (
              <p
                role="status"
                className={
                  passwordMessage === 'Password updated. Use it the next time you sign in.'
                    ? undefined
                    : 'p-error'
                }
              >
                {passwordMessage}
              </p>
            )}
            <form className="p-form" onSubmit={savePassword}>
              <label className="p-field">
                <span>Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={event => setCurrentPassword(event.target.value)}
                />
              </label>
              <div className="p-form-grid">
                <label className="p-field">
                  <span>New password</span>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    autoComplete="new-password"
                    onChange={event => setNewPassword(event.target.value)}
                  />
                </label>
                <label className="p-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={event => setConfirmPassword(event.target.value)}
                  />
                </label>
              </div>
              <div className="p-actions">
                <button type="submit" className="p-button" disabled={passwordBusy}>
                  {passwordBusy ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </Panel>
        </div>
        <aside className="p-stack">
          <Panel className="tinted">
            <p className="p-eyebrow">Company profile</p>
            <h2>
              <Building2 aria-hidden size={18} className="p-inline-icon" /> Company details
            </h2>
            <p>
              {company
                ? `These details identify ${company.name} across Fixth, including the public company profile students can view.`
                : 'Company name, industry, location, logo, and description are saved during onboarding and can be edited here once the company profile is available.'}
            </p>
            {company?.slug && <Badge tone="neutral">Public profile: /{company.slug}</Badge>}
            {user && 'company_id' in user && Boolean(user.company_id) && (
              <Badge tone="success">Linked to your company record</Badge>
            )}
          </Panel>
          <Panel>
            <h2>
              <ShieldCheck aria-hidden size={18} className="p-inline-icon" /> Verification
            </h2>
            <p>
              Company verification is reviewed and managed by Fixth administrators. Contact support
              if your verification status looks wrong.
            </p>
            {company ? (
              <Badge tone={company.verificationStatus === 'Verified' ? 'success' : 'neutral'}>
                {company.verificationStatus || 'Not verified yet'}
              </Badge>
            ) : (
              <Badge tone="neutral">Admin managed</Badge>
            )}
          </Panel>
          <Panel>
            <h2>Workspace</h2>
            <div className="p-stack">
              <Link to="/company/placements" className="p-button">
                Manage placements
              </Link>
              <Link to="/company/applicants" className="p-button secondary">
                Review applicants
              </Link>
              <button
                type="button"
                className="p-button secondary"
                disabled={signOutBusy}
                onClick={() => void handleSignOut()}
              >
                {signOutBusy ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}
