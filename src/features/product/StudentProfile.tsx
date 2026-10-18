import { Field, ValidatedForm } from './components/Form'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileText, Upload, Pencil, ShieldCheck } from 'lucide-react';
import { useProduct } from './useProduct';
import { initials, profileStrength, type Profile } from './data';
import { Badge, Panel, Modal, FilePreview } from './components/ui';
function Details({ items }: {
    items: [
        string,
        string
    ][];
}) { return <dl className="p-definition">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>; }
export function ProfilePage() {
    const { state, deleteProfile } = useProduct();
    const navigate = useNavigate();
    const [confirm, setConfirm] = useState(false);
    const profile = state.profile;
    const name = `${profile.firstName} ${profile.lastName}`.trim() || 'Your profile';
    return <div className="p-columns"><Panel><div className="p-between"><div className="p-identity"><span className="p-avatar large">{profile.photo ? <img src={profile.photo} alt="" /> : initials(name)}</span><div><h2>{name}</h2><p>{profile.discipline || 'Add your discipline'} student <ShieldCheck size={14} className="p-inline-success" aria-hidden/></p></div></div><Link to="/student/profile/edit" className="p-button"><Pencil size={14} aria-hidden/>Edit profile</Link></div><div className="p-profile-contact"><div><small>Email</small><p>{profile.email || 'Not provided'}</p></div><div><small>Location</small><p>{profile.location || 'Not provided'}</p></div><div><small>Phone</small><p>{profile.phone || 'Not provided'}</p></div></div><h3>Education</h3><Details items={[['Institution', profile.institution], ['Discipline', profile.discipline], ['Academic level', `${profile.level} level`], ['Graduation year', profile.graduation]]}/><h3>Placement preferences</h3><Details items={[['Preferred locations', profile.location], ['Duration', profile.duration], ['Work type', profile.workStyle]]}/><h3>Skills</h3><Details items={[['Core skills', profile.skills], ['Interests', profile.interests], ['Portfolio', profile.portfolio]]}/></Panel><aside className="p-stack"><Panel><div className="p-between"><h2>Profile strength</h2><strong className="p-text-link">{profileStrength(profile)}%</strong></div><progress aria-label="Profile completion" max={100} value={profileStrength(profile)}/><p>Add a portfolio link and active resume to complete your profile.</p></Panel><Panel className="tinted"><p className="p-eyebrow">Active resume</p><h2>{profile.resume || 'No active resume'}</h2><Link className="p-text-link" to="/student/resume">Manage or replace resume →</Link></Panel><Panel><h2>Account settings</h2><button type="button" className="p-danger-link" onClick={() => setConfirm(true)}>Delete account and data</button></Panel></aside>{confirm && <Modal title="Delete your profile?" onClose={() => setConfirm(false)}><p>This removes your profile, saved placements, resume selection, and applications from this browser preview. This cannot be undone.</p><div className="p-actions"><button type="button" className="p-button secondary" onClick={() => setConfirm(false)}>Keep my profile</button><button type="button" className="p-button danger" onClick={() => { deleteProfile(); setConfirm(false); navigate('/onboarding/student/email'); }}>Delete profile data</button></div></Modal>}</div>;
}
export function EditProfilePage() {
    const { state, updateProfile } = useProduct();
    const [profile, setProfile] = useState<Profile>(state.profile);
    const [photoError, setPhotoError] = useState('');
    const navigate = useNavigate();
    const update = (key: keyof Profile, value: string) => setProfile(p => ({ ...p, [key]: key === 'level' ? Number(value) : value }));
    const fields: {
        name: keyof Profile;
        label: string;
        type?: string;
        required?: boolean;
    }[] = [
        { name: 'firstName', label: 'First name', required: true }, { name: 'lastName', label: 'Last name', required: true },
        { name: 'email', label: 'Email address', type: 'email', required: true }, { name: 'phone', label: 'Phone number', type: 'tel' }, { name: 'location', label: 'Location', required: true },
        { name: 'institution', label: 'Institution', required: true }, { name: 'discipline', label: 'Discipline', required: true }, { name: 'level', label: 'Academic level', type: 'number', required: true },
        { name: 'graduation', label: 'Graduation year', type: 'number' }, { name: 'studentId', label: 'Student ID' },
        { name: 'duration', label: 'Preferred duration' }, { name: 'workStyle', label: 'Work type' }, { name: 'portfolio', label: 'Portfolio link', type: 'url' },
        { name: 'skills', label: 'Core skills' }, { name: 'interests', label: 'Interests' },
    ];
    return <div className="p-columns"><Panel><div className="p-between"><h2>Profile information</h2><Badge tone="neutral">{JSON.stringify(profile) === JSON.stringify(state.profile) ? 'Saved' : 'Unsaved changes'}</Badge></div><p>Required fields help determine placement eligibility.</p><ValidatedForm className="p-form" onSubmit={e => { e.preventDefault(); updateProfile(profile); navigate('/student/profile'); }}><div className="p-identity"><span className="p-avatar large">{profile.photo ? <img src={profile.photo} alt="" /> : initials(`${profile.firstName} ${profile.lastName}`)}</span><Field className="p-field"><span>Change photo</span><input type="file" name="photo" accept="image/png,image/jpeg,image/webp" aria-describedby={photoError ? 'photo-error' : undefined} aria-invalid={!!photoError || undefined} onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setPhotoError('Choose a PNG, JPEG, or WebP image smaller than 2 MB.'); return } const reader = new FileReader(); reader.onload = () => { setProfile(p => ({ ...p, photo: String(reader.result) })); setPhotoError('') }; reader.onerror = () => setPhotoError('The selected image could not be read.'); reader.readAsDataURL(file) }} />{photoError && <span id="photo-error" role="alert" className="p-error">{photoError}</span>}</Field></div><div className="p-form-grid">{fields.map(field => <Field className="p-field" key={field.name}><span>{field.label}{field.required ? ' *' : ''}</span><input name={field.name} type={field.type || 'text'} required={field.required} value={profile[field.name] ?? ''} min={field.name === 'level' ? 100 : field.name === 'graduation' ? 2000 : undefined} max={field.name === 'level' ? 700 : field.name === 'graduation' ? 2100 : undefined} step={field.name === 'level' ? 100 : undefined} onChange={e => update(field.name, e.target.value)} autoComplete={field.name === 'firstName' ? 'given-name' : field.name === 'lastName' ? 'family-name' : field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'off'}/></Field>)}</div><div className="p-actions"><Link to="/student/profile" className="p-button secondary">Cancel</Link><button className="p-button" type="submit">Save changes</button></div></ValidatedForm></Panel><aside><Panel className="tinted"><h2>Why accuracy matters</h2><p>Your discipline determines which restricted placements you can apply to. Keep academic details accurate and current.</p></Panel></aside></div>;
}
export function ResumePage() {
    const { state, resumeFile, setResumeFile, updateProfile } = useProduct();
    const [preview, setPreview] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    function choose(file?: File) {
        if (!file)
            return;
        if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
            setError('Choose a PDF, DOC, or DOCX file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Choose a file smaller than 5 MB.');
            return;
        }
        setError('');
        setResumeFile(file);
        updateProfile({ ...state.profile, resume: file.name });
        setMessage('Your active resume has been replaced in this preview.');
    }
    return <div className="p-columns"><Panel><div className="p-between"><h2>Active resume</h2><Badge>{state.profile.resume ? 'Active' : 'Resume needed'}</Badge></div><p>This file is shared with companies when you apply.</p>{state.profile.resume && <div className="p-file"><FileText aria-hidden size={26}/><div className="p-grow"><strong>{state.profile.resume}</strong><small>{resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(1)} MB · Available in this tab` : 'File selection saved · Select again to view after a refresh'}</small></div><button type="button" className="p-button subtle" onClick={() => setPreview(true)}>View</button></div>}<h3>Replace your active resume</h3><div className="p-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}><Upload size={30} aria-hidden/><p>Drag and drop your resume here, or choose a file.</p><Field className="p-field"><span>Choose resume file</span><input name="resume" type="file" accept=".pdf,.doc,.docx" aria-invalid={!!error} aria-describedby={error ? 'resume-error' : 'resume-help'} onChange={e => choose(e.target.files?.[0])}/></Field><p id="resume-help" className="p-small">PDF or DOC · Maximum 5 MB. Files stay in this tab until a backend is connected.</p>{error && <p id="resume-error" role="alert" className="p-error">{error}</p>}</div><p role="status">{message}</p></Panel><aside><Panel className="tinted"><p className="p-eyebrow">Resume checklist</p><h2>Before you upload</h2><ul className="p-checklist"><li>Use a clear file name</li><li>Keep details up to date</li><li>Check contact information</li><li>Avoid password-protected files</li></ul></Panel></aside>{preview && <FilePreview file={resumeFile} title="Your active resume" onClose={() => setPreview(false)}/>}</div>;
}



