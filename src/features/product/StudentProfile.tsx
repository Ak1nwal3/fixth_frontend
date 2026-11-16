import { Field, ValidatedForm } from './components/Form'
import { fileSizeLabel, fileTypeLabel, shortenFileName } from '@/lib/files';
import { useState, useEffect, type SubmitEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import Combobox from '@/components/common/Combobox';
import CharCount from '@/components/common/CharCount';
import { ENGINEERING_DISCIPLINES } from '@/lib/disciplines';
import { NIGERIAN_UNIVERSITIES } from '@/lib/universities';
import { LIMITS, lengthError } from '@/lib/limits';
import { FileText, Upload, Pencil, ShieldCheck } from 'lucide-react';
import { initials, dateLabel } from './data';
import { useStudentData } from './useStudentData';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/services/http';
import { getStudentProfile, type StudentProfilePatch } from '@/services/profile';
import { apiErrorMessage } from '@/services/types';
import type { ApiDocument } from '@/services/types';
import { downloadDocument } from '@/services/documents';
import { MAX_PHOTO_BYTES, deleteStudentAccount, deleteStudentPhoto, submitStudentVerification, uploadStudentPhoto } from '@/services/studentMedia';
import { Avatar, Badge, Panel, Modal } from './components/ui';

/** Opens the editor focused on one field, so "Add" goes straight to it. */
function AddLink({ field, label }: { field: string; label: string }) {
    return <Link className="p-add-link" to={`/student/profile/edit?field=${field}`} aria-label={`Add ${label.toLowerCase()}`}><Pencil size={12} aria-hidden />Add</Link>;
}

function Details({ items }: {
    items: [label: string, value: string, field: string][];
}) {
    return <dl className="p-definition">{items.map(([label, value, field]) => <div key={label}><dt>{label}</dt><dd>{value
        ? field === 'portfolio' ? <a className="p-text-link" href={value} target="_blank" rel="noopener noreferrer">{value.replace(/^https?:\/\//, '')}</a> : value
        : <><span className="p-muted">Not provided</span> <AddLink field={field} label={label} /></>}</dd></div>)}</dl>;
}

function ProfileStatus() {
    const { status, error, reload } = useStudentData();
    if (status === 'loading') return <Panel><p role="status">Loading your profile…</p></Panel>;
    if (status === 'missing') return <Panel><h2>Profile not found</h2><p>Your student profile could not be found. Contact support if this keeps happening.</p></Panel>;
    if (status === 'error') return <Panel><h2>Profile could not be loaded</h2><p role="alert">{error}</p><button type="button" className="p-button" onClick={reload}>Try again</button></Panel>;
    return null;
}

export function ProfilePage() {
    const { profile, status, replaceProfile } = useStudentData();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [confirm, setConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [verificationBusy, setVerificationBusy] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<{ text: string; error: boolean } | null>(null);
    if (status !== 'ready' || !profile) return <ProfileStatus />;
    const name = `${profile.firstName} ${profile.lastName}`.trim() || 'Your profile';
    const verificationTone = profile.verificationStatus === 'Verified' ? 'success' : profile.verificationStatus === 'Rejected' ? 'danger' : 'warning';
    const submitVerification = async () => {
        if (verificationBusy) return;
        setVerificationBusy(true);
        setVerificationMessage(null);
        try {
            await submitStudentVerification();
            replaceProfile({ ...profile, verificationStatus: 'Pending' });
            setVerificationMessage({ text: 'Submitted for review. We will let you know when a decision is made.', error: false });
        } catch (error) {
            setVerificationMessage({ text: error instanceof ApiError ? apiErrorMessage(error.body, 'Your profile could not be submitted.') : 'Could not reach the server. Check your connection and try again.', error: true });
        } finally {
            setVerificationBusy(false);
        }
    };
    const deleteAccount = async () => {
        if (deleting) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await deleteStudentAccount();
            await signOut();
            navigate('/', { replace: true });
        } catch (error) {
            setDeleting(false);
            setDeleteError(error instanceof ApiError ? apiErrorMessage(error.body, 'Your account could not be deleted. Try again.') : 'Could not reach the server. Try again.');
        }
    };
    return <div className="p-columns"><Panel><div className="p-between"><div className="p-identity"><Avatar className="large" src={profile.photo?.url} fallback={initials(name)} /><div><h2>{name}</h2><p>{profile.discipline || 'Add your discipline'} student {profile.verificationStatus === 'Verified' && <ShieldCheck size={14} className="p-inline-success" aria-hidden/>}</p></div></div><Link to="/student/profile/edit" className="p-button"><Pencil size={14} aria-hidden/>Edit profile</Link></div><div className="p-profile-contact"><div><small>Email</small><p>{profile.email || 'Not provided'}</p></div><div><small>Location</small><p>{profile.location || <AddLink field="location" label="Location" />}</p></div><div><small>Phone</small><p>{profile.phone || <AddLink field="phone" label="Phone" />}</p></div></div><h3>Education</h3><Details items={[['Institution', profile.institution, 'institution'], ['Discipline', profile.discipline, 'discipline'], ['Academic level', profile.level ? `${profile.level} level` : '', 'level'], ['Graduation year', profile.graduationYear ? String(profile.graduationYear) : '', 'graduation'], ['Student ID', profile.studentId, 'studentId']]}/><h3>Placement preferences</h3><Details items={[['Duration', profile.duration, 'duration'], ['Work type', profile.workStyles.join(' · '), 'workStyle']]}/><h3>Skills</h3><Details items={[['Core skills', profile.skills.join(' · '), 'skills'], ['Interests', profile.interests, 'interests'], ['Portfolio', profile.portfolio, 'portfolio']]}/></Panel><aside className="p-stack"><Panel><div className="p-between"><h2>Profile strength</h2><strong className="p-text-link">{profile.profileStrength}%</strong></div><progress aria-label="Profile completion" max={100} value={profile.profileStrength}/><p>Add a portfolio link and active resume to complete your profile.</p></Panel><Panel className="tinted"><p className="p-eyebrow">Active resume</p><h2 className="file-name" title={profile.resume?.original_name}>{profile.resume ? shortenFileName(profile.resume.original_name, 40) : 'No active resume'}</h2><Link className="p-text-link" to="/student/resume">Manage or replace resume →</Link></Panel><Panel className="tinted"><p className="p-eyebrow">Verification</p><div className="p-between"><h2>{profile.verificationStatus === 'Verified' ? 'You are verified' : 'Account verification'}</h2><Badge tone={verificationTone}>{profile.verificationStatus}</Badge></div>{profile.verificationStatus === 'Verified' ? <p className="p-small">A verified badge appears next to your profile for companies that receive your applications.</p> : profile.verificationStatus === 'Pending' ? <><p className="p-small">Your profile is in the review queue. We will let you know when a decision is made.</p>{verificationMessage && <p role={verificationMessage.error ? 'alert' : 'status'} className={verificationMessage.error ? 'p-error' : 'p-small'}>{verificationMessage.text}</p>}</> : <><p className="p-small">{profile.verificationStatus === 'Rejected' ? 'Your last submission was rejected. You can submit your profile for review again.' : 'Submit your profile for review. No extra documents are required — the review uses your current profile.'}</p>{verificationMessage && <p role={verificationMessage.error ? 'alert' : 'status'} className={verificationMessage.error ? 'p-error' : 'p-small'}>{verificationMessage.text}</p>}<button type="button" className="p-button" disabled={verificationBusy} onClick={submitVerification}>{verificationBusy ? 'Submitting…' : profile.verificationStatus === 'Rejected' ? 'Submit again' : 'Submit for review'}</button></>}</Panel><Panel><h2>Account settings</h2><button type="button" className="p-danger-link" onClick={() => !deleting && setConfirm(true)}>Delete account and data</button></Panel></aside>{confirm && <Modal title="Delete your account?" onClose={() => !deleting && setConfirm(false)}><p>This permanently deletes your profile, saved placements, and personal data. Applications that companies must keep for their records are retained without your personal details. You will be signed out and cannot undo this.</p>{deleteError && <p role="alert" className="p-error">{deleteError}</p>}<div className="p-actions"><button type="button" className="p-button secondary" disabled={deleting} onClick={() => setConfirm(false)}>Keep my account</button><button type="button" className="p-button" disabled={deleting} onClick={deleteAccount}>{deleting ? 'Deleting…' : 'Delete account'}</button></div></Modal>}</div>;
}

interface EditableProfile {
    firstName: string; lastName: string; email: string; phone: string; location: string;
    institution: string; discipline: string; level: number; graduation: string; studentId: string;
    duration: string; workStyle: string; portfolio: string; skills: string; interests: string;
}

function splitList(value: string): string[] {
    return value.split(/[·,]/).map(item => item.trim()).filter(Boolean);
}

const WORK_STYLES = ['On-site', 'Hybrid', 'Remote'];
const LEVELS = [100, 200, 300, 400, 500, 600, 700];
const DURATIONS = ['3 months', '4 months', '6 months', '12 months'];

/** Accepts "mysite.com" as well as a full link; the API needs http(s)://. */
function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function urlError(value: string): string {
    if (!value.trim()) return '';
    try {
        const url = new URL(normalizeUrl(value));
        return url.hostname.includes('.') ? '' : 'Enter a full link, such as yoursite.com or github.com/you.';
    } catch {
        return 'Enter a full link, such as yoursite.com or github.com/you.';
    }
}

/** Soft limits for the plain text fields, matching the API. */
const FIELD_LIMITS: Partial<Record<keyof EditableProfile, number>> = {
    firstName: LIMITS.studentFirstName, lastName: LIMITS.studentLastName, phone: LIMITS.phone,
    location: LIMITS.studentLocation, institution: LIMITS.institution, discipline: LIMITS.discipline,
    studentId: LIMITS.studentId, duration: LIMITS.studentDuration, portfolio: LIMITS.portfolio,
};

/** Maps API validation error fields back to the camelCase form field names. */
const apiFieldNames: Record<string, keyof EditableProfile> = {
    first_name: 'firstName', last_name: 'lastName', phone: 'phone', location: 'location',
    institution: 'institution', discipline: 'discipline', level: 'level',
    graduation_year: 'graduation', student_id: 'studentId', duration: 'duration',
    work_styles: 'workStyle', portfolio: 'portfolio', skills: 'skills', interests: 'interests',
};

export function EditProfilePage() {
    const { profile, status, saveProfile, replaceProfile } = useStudentData();
    const navigate = useNavigate();
    const [form, setForm] = useState<EditableProfile | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof EditableProfile, string>>>({});
    const [photoBusy, setPhotoBusy] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [searchParams] = useSearchParams();
    const focusField = searchParams.get('field');
    // "Add" links on the profile open the editor on that field.
    useEffect(() => {
        if (status !== 'ready' || !focusField) return;
        const target = document.getElementById(`profile-${focusField}`);
        target?.scrollIntoView({ block: 'center' });
        target?.focus({ preventScroll: true });
    }, [status, focusField]);
    if (status !== 'ready' || !profile) return <ProfileStatus />;
    const current: EditableProfile = form ?? {
        firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone,
        location: profile.location, institution: profile.institution, discipline: profile.discipline, level: profile.level,
        graduation: profile.graduationYear ? String(profile.graduationYear) : '', studentId: profile.studentId,
        duration: profile.duration, workStyle: profile.workStyles.join(' · '), portfolio: profile.portfolio,
        skills: profile.skills.join(' · '), interests: profile.interests,
    };
    const update = (key: keyof EditableProfile, value: string) => {
        setForm({ ...current, [key]: key === 'level' ? Number(value) : value });
        setErrors(prev => ({ ...prev, [key]: '' }));
        setMessage('');
    };
    const fields: {
        name: keyof EditableProfile;
        label: string;
        type?: string;
        required?: boolean;
        disabled?: boolean;
        hint?: string;
    }[] = [
        { name: 'firstName', label: 'First name', required: true }, { name: 'lastName', label: 'Last name', required: true },
        { name: 'email', label: 'Email address', type: 'email', disabled: true, hint: 'Email changes are not available yet.' }, { name: 'phone', label: 'Phone number', type: 'tel' }, { name: 'location', label: 'Location', required: true },
        { name: 'graduation', label: 'Graduation year', type: 'number' }, { name: 'studentId', label: 'Student ID' },
        { name: 'duration', label: 'Preferred duration', hint: 'For example 6 months.' }, { name: 'portfolio', label: 'Portfolio link', hint: 'Your website, GitHub, Behance, or LinkedIn. https:// is added for you.' },
        { name: 'skills', label: 'Core skills', hint: 'Separate skills with commas.' }, { name: 'interests', label: 'Interests' },
    ];
    const selectedStyles = splitList(current.workStyle);
    const toggleStyle = (style: string) => update('workStyle', (selectedStyles.includes(style) ? selectedStyles.filter(item => item !== style) : [...selectedStyles, style]).join(' · '));
    const fieldError = (name: keyof EditableProfile) => errors[name] && <span role="alert" className="p-error">{errors[name]}</span>;
    const onPhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || photoBusy || !profile) return;
        if (file.size > MAX_PHOTO_BYTES) {
            setPhotoError('Photos must be 2 MB or smaller.');
            return;
        }
        setPhotoBusy(true);
        setPhotoError('');
        try {
            const updated = await uploadStudentPhoto(file);
            replaceProfile(updated);
        } catch (error) {
            setPhotoError(error instanceof ApiError ? apiErrorMessage(error.body, 'The photo could not be uploaded.') : 'Could not reach the server. Check your connection and try again.');
        } finally {
            setPhotoBusy(false);
        }
    };
    const removePhoto = async () => {
        if (photoBusy || !profile) return;
        setPhotoBusy(true);
        setPhotoError('');
        try {
            await deleteStudentPhoto();
            replaceProfile({ ...profile, photo: null });
        } catch (error) {
            setPhotoError(error instanceof ApiError ? apiErrorMessage(error.body, 'The photo could not be removed.') : 'Could not reach the server. Check your connection and try again.');
        } finally {
            setPhotoBusy(false);
        }
    };
    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        const problems: Partial<Record<keyof EditableProfile, string>> = {};
        for (const [key, max] of Object.entries(FIELD_LIMITS) as [keyof EditableProfile, number][]) {
            const tooLong = lengthError(String(current[key] ?? ''), max);
            if (tooLong) problems[key] = tooLong;
        }
        const badUrl = urlError(current.portfolio);
        if (badUrl) problems.portfolio = badUrl;
        if (!current.discipline.trim()) problems.discipline = 'Choose your discipline from the list.';
        if (Object.keys(problems).length) {
            setErrors(problems);
            setMessage('Review the highlighted fields.');
            document.getElementById(`profile-${Object.keys(problems)[0]}`)?.focus();
            return;
        }
        const patch: StudentProfilePatch = {
            firstName: current.firstName, lastName: current.lastName, phone: current.phone,
            location: current.location, institution: current.institution, discipline: current.discipline,
            level: Number(current.level),
            graduationYear: current.graduation ? Number(current.graduation) : null,
            studentId: current.studentId, duration: current.duration,
            workStyles: splitList(current.workStyle), portfolio: normalizeUrl(current.portfolio),
            skills: splitList(current.skills), interests: current.interests,
        };
        setBusy(true);
        setMessage('');
        try {
            await saveProfile(patch);
            navigate('/student/profile');
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 400 && error.body && typeof error.body === 'object') {
                    const fieldErrors: Partial<Record<keyof EditableProfile, string>> = {};
                    for (const [key, value] of Object.entries(error.body)) {
                        const name = apiFieldNames[key];
                        if (name && Array.isArray(value) && typeof value[0] === 'string') fieldErrors[name] = value[0];
                    }
                    setErrors(fieldErrors);
                    setMessage(Object.keys(fieldErrors).length ? 'Review the highlighted fields.' : apiErrorMessage(error.body, 'Your profile could not be saved.'));
                } else if (error.status === 429) {
                    setMessage('Too many requests. Please wait a moment and try again.');
                } else {
                    setMessage(apiErrorMessage(error.body, 'Your profile could not be saved.'));
                }
            } else {
                setMessage('Could not reach the server. Check your connection and try again.');
            }
        } finally {
            setBusy(false);
        }
    };
    return <div className="p-columns"><Panel><div className="p-between"><h2>Profile information</h2><Badge tone="neutral">{form === null ? 'Saved' : 'Unsaved changes'}</Badge></div><p>Required fields help determine placement eligibility.</p><ValidatedForm className="p-form" onSubmit={submit}><div className="p-identity"><Avatar className="large" src={profile.photo?.url} fallback={initials(`${current.firstName} ${current.lastName}`)} /><Field className="p-field"><span>Change photo</span><input type="file" name="photo" accept="image/png,image/jpeg,image/webp" disabled={photoBusy} onChange={onPhotoSelect} aria-describedby="photo-note" /><span id="photo-note" className="p-small">PNG, JPEG, or WebP · Maximum 2 MB.</span>{profile.photo && <button type="button" className="p-danger-link" disabled={photoBusy} onClick={removePhoto}>Remove photo</button>}</Field>{photoError && <p role="alert" className="p-error">{photoError}</p>}</div><div className="p-form-grid">{fields.map(field => <Field className="p-field" key={field.name}><span>{field.label}{field.required ? ' *' : ''}</span><input id={`profile-${field.name}`} name={field.name} type={field.type || 'text'} inputMode={field.name === 'portfolio' ? 'url' : undefined} list={field.name === 'duration' ? 'profile-durations' : undefined} required={field.required} disabled={field.disabled} data-max={FIELD_LIMITS[field.name]} value={current[field.name] ?? ''} min={field.name === 'graduation' ? 2000 : undefined} max={field.name === 'graduation' ? 2100 : undefined} onChange={e => update(field.name, e.target.value)} autoComplete={field.name === 'firstName' ? 'given-name' : field.name === 'lastName' ? 'family-name' : field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : field.name === 'portfolio' ? 'url' : 'off'} placeholder={field.name === 'portfolio' ? 'yoursite.com' : undefined} aria-invalid={!!errors[field.name] || undefined} />{field.hint && !errors[field.name] && <span className="p-small">{field.hint}</span>}{fieldError(field.name)}{FIELD_LIMITS[field.name] && !errors[field.name] && <CharCount value={String(current[field.name] ?? '')} max={FIELD_LIMITS[field.name]!} />}</Field>)}
<div className="p-field"><label htmlFor="profile-institution">Institution *</label><Combobox id="profile-institution" name="institution" required allowCustom options={NIGERIAN_UNIVERSITIES} value={current.institution} onChange={value => update('institution', value)} placeholder="Search universities, e.g. Lagos" invalid={!!errors.institution} />{fieldError('institution')}</div>
<div className="p-field"><label htmlFor="profile-discipline">Discipline *</label><Combobox id="profile-discipline" name="discipline" required options={ENGINEERING_DISCIPLINES} value={current.discipline} onChange={value => update('discipline', value)} placeholder="Search disciplines, e.g. Mechanical" invalid={!!errors.discipline} pickMessage="Choose your discipline from the list." />{fieldError('discipline')}</div>
<Field className="p-field"><span>Academic level *</span><select id="profile-level" name="level" required value={current.level || ''} onChange={e => update('level', e.target.value)}><option value="" disabled>Select your level</option>{LEVELS.map(level => <option key={level} value={level}>{level} level</option>)}</select>{fieldError('level')}</Field>
<fieldset className="p-field p-checks" id="profile-workStyle" tabIndex={-1}><legend>Work type</legend><div>{WORK_STYLES.map(style => <label key={style} className="p-check"><input type="checkbox" checked={selectedStyles.includes(style)} onChange={() => toggleStyle(style)} />{style}</label>)}</div>{fieldError('workStyle')}</fieldset>
<datalist id="profile-durations">{DURATIONS.map(option => <option key={option} value={option} />)}</datalist></div><p role="alert" className="p-error">{message}</p><div className="p-actions"><button type="submit" className="p-button" disabled={busy || form === null}>{busy ? 'Saving…' : 'Save changes'}</button><Link to="/student/profile" className="p-button secondary">Cancel</Link></div></ValidatedForm></Panel><aside><Panel className="tinted"><p className="p-eyebrow">Why it matters</p><h2>Accurate details improve matches</h2><p>Your discipline, level, and skills determine which placements you’re eligible for.</p></Panel></aside></div>;
}

import { MAX_RESUME_BYTES, deleteStudentResume, getActiveStudentResume, uploadStudentResume } from '@/services/studentMedia';

export function ResumePage() {
    const { profile, status, replaceProfile } = useStudentData();
    const [busyAction, setBusyAction] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resumeDoc, setResumeDoc] = useState<ApiDocument | null | undefined>(undefined);
    const [fetchAttempt, setFetchAttempt] = useState(0);
    useEffect(() => {
        if (status !== 'ready') return;
        let live = true;
        getActiveStudentResume()
            .then(doc => {
                if (live) setResumeDoc(doc);
            })
            .catch((err: unknown) => {
                if (!live) return;
                setError(err instanceof ApiError ? apiErrorMessage(err.body, 'Your resume could not be loaded.') : 'Could not reach the server. Check your connection and try again.');
                setResumeDoc(null);
            });
        return () => {
            live = false;
        };
    }, [status, fetchAttempt]);
    if (status !== 'ready' || !profile) return <ProfileStatus />;
    const resume = resumeDoc === undefined ? profile.resume : resumeDoc;
    /** Re-reads the profile so the resume and profile strength stay current everywhere. */
    const syncProfile = () => getStudentProfile().then(replaceProfile).catch(() => undefined);
    const setBusy = (action: string, busy: boolean) => setBusyAction(current => (busy ? action : current === action ? '' : current));
    const onResumeSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || busyAction) return;
        if (file.size > MAX_RESUME_BYTES) {
            setError('Resumes must be 5 MB or smaller.');
            return;
        }
        setMessage('');
        setError('');
        setBusy('upload', true);
        try {
            await uploadStudentResume(file);
            setMessage('New resume uploaded and active.');
            setFetchAttempt(value => value + 1);
            void syncProfile();
        } catch (caught) {
            setError(caught instanceof ApiError ? apiErrorMessage(caught.body, 'The resume could not be uploaded.') : 'Could not reach the server. Check your connection and try again.');
        } finally {
            setBusy('upload', false);
        }
    };
    const removeResume = async () => {
        if (busyAction) return;
        setMessage('');
        setError('');
        setBusy('delete', true);
        try {
            await deleteStudentResume();
            setResumeDoc(null);
            replaceProfile({ ...profile, resume: null });
            void syncProfile();
            setMessage('Resume removed. Upload a new one before applying.');
        } catch (caught) {
            setError(caught instanceof ApiError ? apiErrorMessage(caught.body, 'The resume could not be removed.') : 'Could not reach the server. Check your connection and try again.');
        } finally {
            setBusy('delete', false);
        }
    };
    const download = async () => {
        if (!resume || busyAction) return;
        setBusy('download', true);
        try {
            await downloadDocument(resume);
        } catch (caught) {
            setError(caught instanceof ApiError ? apiErrorMessage(caught.body, 'The resume could not be downloaded.') : 'Could not reach the server. Try again.');
        } finally {
            setBusy('download', false);
        }
    };
    return <div className="p-columns"><Panel><div className="p-between"><h2>Active resume</h2><Badge>{resume ? 'Active' : 'Resume needed'}</Badge></div><p>This file is shared with companies when you apply.</p>{resume && <div className="p-file"><FileText aria-hidden size={26}/><div className="p-grow"><strong className="file-name" title={resume.original_name}>{shortenFileName(resume.original_name)}</strong><small>{fileSizeLabel(resume.size)} · {fileTypeLabel(resume.mime_type)} · Uploaded {dateLabel(resume.created_at)}</small></div></div>}{resume && <div className="p-actions"><button type="button" className="p-button secondary" disabled={!!busyAction} onClick={download}>{busyAction === 'download' ? 'Downloading…' : 'Download resume'}</button><button type="button" className="p-danger-link" disabled={!!busyAction} onClick={removeResume}>{busyAction === 'delete' ? 'Removing…' : 'Remove resume'}</button></div>}{message && <p role="status" className="p-small">{message}</p>}{error && <p role="alert" className="p-error">{error}</p>}<h3>Upload your resume</h3><div className="p-dropzone"><Upload size={30} aria-hidden/><p>{resume ? 'Replace it with an up-to-date version before applying.' : 'Add a resume so you can apply with one click.'}</p><Field className="p-field"><span>Choose resume file</span><input name="resume" type="file" accept=".pdf,.doc,.docx" disabled={!!busyAction} onChange={onResumeSelect} aria-describedby="resume-help" /></Field><p id="resume-help" className="p-small">PDF or DOC · Maximum 5 MB. Companies receive the version attached to each application.</p></div></Panel><aside><Panel className="tinted"><p className="p-eyebrow">Resume checklist</p><h2>Before you upload</h2><ul className="p-checklist"><li>Use a clear file name</li><li>Keep details up to date</li><li>Check contact information</li><li>Avoid password-protected files</li></ul></Panel></aside></div>;
}
