import { Field, ValidatedForm } from './components/Form'
import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileText, Upload, Pencil, ShieldCheck } from 'lucide-react';
import { initials, dateLabel } from './data';
import { useStudentData } from './useStudentData';
import { ApiError } from '@/services/http';
import type { StudentProfilePatch } from '@/services/profile';
import { apiErrorMessage } from '@/services/types';
import { Badge, Panel, Modal } from './components/ui';

function Details({ items }: {
    items: [
        string,
        string
    ][];
}) { return <dl className="p-definition">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>; }

function ProfileStatus() {
    const { status, error, reload } = useStudentData();
    if (status === 'loading') return <Panel><p role="status">Loading your profile…</p></Panel>;
    if (status === 'missing') return <Panel><h2>Profile not found</h2><p>Your student profile could not be found. Contact support if this keeps happening.</p></Panel>;
    if (status === 'error') return <Panel><h2>Profile could not be loaded</h2><p role="alert">{error}</p><button type="button" className="p-button" onClick={reload}>Try again</button></Panel>;
    return null;
}

export function ProfilePage() {
    const { profile, status } = useStudentData();
    const [confirm, setConfirm] = useState(false);
    if (status !== 'ready' || !profile) return <ProfileStatus />;
    const name = `${profile.firstName} ${profile.lastName}`.trim() || 'Your profile';
    return <div className="p-columns"><Panel><div className="p-between"><div className="p-identity"><span className="p-avatar large">{profile.photo?.url ? <img src={profile.photo.url} alt="" /> : initials(name)}</span><div><h2>{name}</h2><p>{profile.discipline || 'Add your discipline'} student {profile.verificationStatus === 'Verified' && <ShieldCheck size={14} className="p-inline-success" aria-hidden/>}</p></div></div><Link to="/student/profile/edit" className="p-button"><Pencil size={14} aria-hidden/>Edit profile</Link></div><div className="p-profile-contact"><div><small>Email</small><p>{profile.email || 'Not provided'}</p></div><div><small>Location</small><p>{profile.location || 'Not provided'}</p></div><div><small>Phone</small><p>{profile.phone || 'Not provided'}</p></div></div><h3>Education</h3><Details items={[['Institution', profile.institution], ['Discipline', profile.discipline], ['Academic level', `${profile.level} level`], ['Graduation year', profile.graduationYear ? String(profile.graduationYear) : '']]}/><h3>Placement preferences</h3><Details items={[['Preferred locations', profile.location], ['Duration', profile.duration], ['Work type', profile.workStyles.join(' · ')]]}/><h3>Skills</h3><Details items={[['Core skills', profile.skills.join(' · ')], ['Interests', profile.interests], ['Portfolio', profile.portfolio]]}/></Panel><aside className="p-stack"><Panel><div className="p-between"><h2>Profile strength</h2><strong className="p-text-link">{profile.profileStrength}%</strong></div><progress aria-label="Profile completion" max={100} value={profile.profileStrength}/><p>Add a portfolio link and active resume to complete your profile.</p></Panel><Panel className="tinted"><p className="p-eyebrow">Active resume</p><h2>{profile.resume?.original_name || 'No active resume'}</h2><Link className="p-text-link" to="/student/resume">Manage or replace resume →</Link></Panel><Panel><h2>Account settings</h2><button type="button" className="p-danger-link" onClick={() => setConfirm(true)}>Delete account and data</button></Panel></aside>{confirm && <Modal title="Delete your profile?" onClose={() => setConfirm(false)}><p>Account deletion is not available yet. When the account deletion API ships, you will be able to remove your profile and data here.</p><div className="p-actions"><button type="button" className="p-button secondary" onClick={() => setConfirm(false)}>Close</button></div></Modal>}</div>;
}

interface EditableProfile {
    firstName: string; lastName: string; email: string; phone: string; location: string;
    institution: string; discipline: string; level: number; graduation: string; studentId: string;
    duration: string; workStyle: string; portfolio: string; skills: string; interests: string;
}

function splitList(value: string): string[] {
    return value.split(/[·,]/).map(item => item.trim()).filter(Boolean);
}

/** Maps API validation error fields back to the camelCase form field names. */
const apiFieldNames: Record<string, keyof EditableProfile> = {
    first_name: 'firstName', last_name: 'lastName', phone: 'phone', location: 'location',
    institution: 'institution', discipline: 'discipline', level: 'level',
    graduation_year: 'graduation', student_id: 'studentId', duration: 'duration',
    work_styles: 'workStyle', portfolio: 'portfolio', skills: 'skills', interests: 'interests',
};

export function EditProfilePage() {
    const { profile, status, saveProfile } = useStudentData();
    const navigate = useNavigate();
    const [form, setForm] = useState<EditableProfile | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof EditableProfile, string>>>({});
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
        { name: 'institution', label: 'Institution', required: true }, { name: 'discipline', label: 'Discipline', required: true }, { name: 'level', label: 'Academic level', type: 'number', required: true },
        { name: 'graduation', label: 'Graduation year', type: 'number' }, { name: 'studentId', label: 'Student ID' },
        { name: 'duration', label: 'Preferred duration' }, { name: 'workStyle', label: 'Work type' }, { name: 'portfolio', label: 'Portfolio link', type: 'url' },
        { name: 'skills', label: 'Core skills' }, { name: 'interests', label: 'Interests' },
    ];
    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        const patch: StudentProfilePatch = {
            firstName: current.firstName, lastName: current.lastName, phone: current.phone,
            location: current.location, institution: current.institution, discipline: current.discipline,
            level: Number(current.level),
            graduationYear: current.graduation ? Number(current.graduation) : null,
            studentId: current.studentId, duration: current.duration,
            workStyles: splitList(current.workStyle), portfolio: current.portfolio,
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
    return <div className="p-columns"><Panel><div className="p-between"><h2>Profile information</h2><Badge tone="neutral">{form === null ? 'Saved' : 'Unsaved changes'}</Badge></div><p>Required fields help determine placement eligibility.</p><ValidatedForm className="p-form" onSubmit={submit}><div className="p-identity"><span className="p-avatar large">{profile.photo?.url ? <img src={profile.photo.url} alt="" /> : initials(`${current.firstName} ${current.lastName}`)}</span><Field className="p-field"><span>Change photo</span><input type="file" name="photo" accept="image/png,image/jpeg,image/webp" disabled aria-describedby="photo-note" /><span id="photo-note" className="p-small">Photo upload is coming soon.</span></Field></div><div className="p-form-grid">{fields.map(field => <Field className="p-field" key={field.name}><span>{field.label}{field.required ? ' *' : ''}</span><input name={field.name} type={field.type || 'text'} required={field.required} disabled={field.disabled} value={current[field.name] ?? ''} min={field.name === 'level' ? 100 : field.name === 'graduation' ? 2000 : undefined} max={field.name === 'level' ? 700 : field.name === 'graduation' ? 2100 : undefined} step={field.name === 'level' ? 100 : undefined} onChange={e => update(field.name, e.target.value)} autoComplete={field.name === 'firstName' ? 'given-name' : field.name === 'lastName' ? 'family-name' : field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'off'} aria-invalid={!!errors[field.name] || undefined} />{field.hint && <span className="p-small">{field.hint}</span>}{errors[field.name] && <span role="alert" className="p-error">{errors[field.name]}</span>}</Field>)}</div><p role="alert" className="p-error">{message}</p><div className="p-actions"><button type="submit" className="p-button" disabled={busy || form === null}>{busy ? 'Saving…' : 'Save changes'}</button><Link to="/student/profile" className="p-button secondary">Cancel</Link></div></ValidatedForm></Panel><aside><Panel className="tinted"><p className="p-eyebrow">Why it matters</p><h2>Accurate details improve matches</h2><p>Your discipline, level, and skills determine which placements you’re eligible for.</p></Panel></aside></div>;
}

export function ResumePage() {
    const { profile, status } = useStudentData();
    if (status !== 'ready' || !profile) return <ProfileStatus />;
    const resume = profile.resume;
    return <div className="p-columns"><Panel><div className="p-between"><h2>Active resume</h2><Badge>{resume ? 'Active' : 'Resume needed'}</Badge></div><p>This file is shared with companies when you apply.</p>{resume && <div className="p-file"><FileText aria-hidden size={26}/><div className="p-grow"><strong>{resume.original_name}</strong><small>{(resume.size / 1024 / 1024).toFixed(1)} MB · Uploaded {dateLabel(resume.created_at)}</small></div></div>}<h3>Replace your active resume</h3><div className="p-dropzone" aria-disabled="true"><Upload size={30} aria-hidden/><p>Resume upload is coming soon.</p><Field className="p-field"><span>Choose resume file</span><input name="resume" type="file" accept=".pdf,.doc,.docx" disabled aria-describedby="resume-help" /></Field><p id="resume-help" className="p-small">PDF or DOC · Maximum 5 MB. The upload endpoint is not available yet.</p></div></Panel><aside><Panel className="tinted"><p className="p-eyebrow">Resume checklist</p><h2>Before you upload</h2><ul className="p-checklist"><li>Use a clear file name</li><li>Keep details up to date</li><li>Check contact information</li><li>Avoid password-protected files</li></ul></Panel></aside></div>;
}
