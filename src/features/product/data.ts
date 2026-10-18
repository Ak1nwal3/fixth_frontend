export type PlacementStatus = 'Active' | 'Draft' | 'Closed' | 'Expired' | 'Unpublished'
export interface Placement {
  id: string; slug: string; title: string; company: string; location: string; workStyle: string;
  duration: string; discipline: string; level: number; stipend: string; description: string;
  responsibilities: string; requirements: string; status: PlacementStatus; reports: number; match: number
}
export interface Candidate {
  id: string; name: string; email: string; institution: string; discipline: string; level: number;
  location: string; skills: string; status: ApplicationStatus; verification: 'Pending' | 'Verified' | 'Rejected'; risk: string
}
export type ApplicationStatus = 'Submitted' | 'Viewed' | 'Shortlisted' | 'Rejected' | 'Accepted'
export interface Application { id: string; placementId: string; status: ApplicationStatus; date: string }
export interface Profile {
  firstName: string; lastName: string; email: string; phone: string; location: string; institution: string;
  discipline: string; level: number; graduation: string; studentId: string; duration: string; workStyle: string;
  portfolio: string; skills: string; interests: string; resume: string; photo?: string
}
const common = {
  level: 300, stipend: '₦180,000', status: 'Active' as const, reports: 0,
  description: 'Join the product engineering team to build accessible, reliable web experiences used by teams across Africa. You’ll work with engineers, designers, and mentors throughout the placement.',
  responsibilities: 'Build responsive interfaces, contribute to code reviews, test product improvements, and document what you learn.',
  requirements: 'Foundational skills, curiosity, and a willingness to learn in a collaborative environment.',
}
export const initialPlacements: Placement[] = [
  { ...common, id: 'pl-1', slug: 'google-fe-intern', title: 'Frontend Engineering Intern', company: 'Google', location: 'Lagos', workStyle: 'Hybrid', duration: '6 months', discipline: 'Computer Engineering', match: 92 },
  { ...common, id: 'pl-2', slug: 'meta-product-design', title: 'Product Design Intern', company: 'Meta', location: 'Remote', workStyle: 'Remote', duration: '4 months', discipline: 'Design', match: 88 },
  { ...common, id: 'pl-3', slug: 'x-data-analytics', title: 'Data Analytics Intern', company: 'X', location: 'Accra', workStyle: 'On-site', duration: '3 months', discipline: 'Data Science', match: 84 },
  { ...common, id: 'pl-4', slug: 'microsoft-cloud', title: 'Cloud Engineering Intern', company: 'Microsoft', location: 'Lagos', workStyle: 'Hybrid', duration: '6 months', discipline: 'Computer Engineering', status: 'Closed', match: 80 },
  { ...common, id: 'pl-5', slug: 'flutterwave-qa', title: 'Software QA Intern', company: 'Flutterwave', location: 'Lagos', workStyle: 'On-site', duration: '3 months', discipline: 'Software Engineering', status: 'Expired', match: 78 },
  { ...common, id: 'pl-6', slug: 'nova-frontend', title: 'Frontend Engineering Intern', company: 'Nova Labs', location: 'Lagos', workStyle: 'Hybrid', duration: '6 months', discipline: 'Computer Engineering', match: 92 },
  { ...common, id: 'pl-7', slug: 'bright-marketing', title: 'Marketing Intern', company: 'Bright Media', location: 'Lagos', workStyle: 'On-site', duration: '3 months', discipline: 'Marketing', reports: 6, match: 70 },
  { ...common, id: 'pl-8', slug: 'nova-design-draft', title: 'Product Design Intern', company: 'Nova Labs', location: 'Lagos', workStyle: 'Hybrid', duration: '4 months', discipline: 'Design', status: 'Draft', match: 88 },
]
export const initialCandidates: Candidate[] = [
  { id: 'c-1', name: 'Ayo Ogun', email: 'ayo.ogun@university.edu.ng', institution: 'University of Lagos', discipline: 'Computer Engineering', level: 400, location: 'Lagos', skills: 'JavaScript · React · Git · Figma', status: 'Shortlisted', verification: 'Pending', risk: 'Low' },
  { id: 'c-2', name: 'Mariam Bello', email: 'mariam.bello@edu.ng', institution: 'University of Abuja', discipline: 'Software Engineering', level: 300, location: 'Abuja', skills: 'React · TypeScript', status: 'Viewed', verification: 'Pending', risk: 'Low' },
  { id: 'c-3', name: 'Chinedu Okafor', email: 'chinedu.okafor@edu.ng', institution: 'Covenant University', discipline: 'Computer Engineering', level: 400, location: 'Lagos', skills: 'Python · Data analysis', status: 'Submitted', verification: 'Pending', risk: 'Review' },
  { id: 'c-4', name: 'Zainab Musa', email: 'zainab.musa@edu.ng', institution: 'Bayero University', discipline: 'Computer Science', level: 300, location: 'Kano', skills: 'JavaScript · Figma', status: 'Viewed', verification: 'Pending', risk: 'Medium' },
  { id: 'c-5', name: 'David Mensah', email: 'david.mensah@edu.gh', institution: 'University of Ghana', discipline: 'Software Engineering', level: 400, location: 'Accra', skills: 'React · Testing', status: 'Rejected', verification: 'Pending', risk: 'Low' },
  { id: 'c-6', name: 'Lola Adeyemi', email: 'lola.adeyemi@edu.ng', institution: 'Yaba College of Tech', discipline: 'Computer Engineering', level: 300, location: 'Lagos', skills: 'React · Git', status: 'Accepted', verification: 'Pending', risk: 'Review' },
]
export const initialProfile: Profile = {
  firstName: 'Ayo', lastName: 'Ogun', email: 'ayo.ogun@university.edu.ng', phone: '+234 801 234 5678',
  location: 'Lagos, Nigeria', institution: 'University of Lagos', discipline: 'Computer Engineering', level: 400,
  graduation: '2027', studentId: 'UNILAG/CE/2048', duration: '3–6 months', workStyle: 'Hybrid · Remote',
  portfolio: '', skills: 'JavaScript · React · Figma · Git', interests: 'Frontend engineering · Product design', resume: '',
}
export const initialApplications: Application[] = [
  { id: 'ap-1', placementId: 'pl-2', status: 'Viewed', date: '2026-06-10' },
  { id: 'ap-2', placementId: 'pl-3', status: 'Submitted', date: '2026-06-08' },
  { id: 'ap-3', placementId: 'pl-4', status: 'Accepted', date: '2026-06-03' },
  { id: 'ap-4', placementId: 'pl-5', status: 'Rejected', date: '2026-05-28' },
]
export function initials(name: string) { return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() }
export function dateLabel(date: string) { return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
export function profileStrength(profile: Profile) {
  const fields = [profile.firstName, profile.lastName, profile.email, profile.phone, profile.location, profile.institution, profile.discipline, profile.skills, profile.resume, profile.portfolio]
  return Math.round(fields.filter(value => !!value?.trim()).length / fields.length * 100)
}
