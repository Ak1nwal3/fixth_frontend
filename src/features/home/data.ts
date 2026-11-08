/*
 * Copy for the marketing home page. Names, companies and logos are
 * illustrative placeholders until real ones exist (see PRODUCT.md).
 */

/* -------------------------------------------------------------------------- */
/*                                    Routes                                  */
/* -------------------------------------------------------------------------- */

export const routes = {
  studentSignUp: '/onboarding/student/email',
  companySignUp: '/onboarding/organization/email',
  signIn: '/auth/sign-in',
  discover: '/student/discover',
  contact: 'mailto:hello@fixth.ng',
} as const

/* -------------------------------------------------------------------------- */
/*                                  Navigation                                */
/* -------------------------------------------------------------------------- */

export interface NavLink {
  label: string
  href: string
}

export const navLinks: NavLink[] = [
  { label: 'For students', href: '#students' },
  { label: 'For companies', href: '#companies' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
]

/* -------------------------------------------------------------------------- */
/*                                     Hero                                   */
/* -------------------------------------------------------------------------- */

export const disciplines = [
  'Mechanical',
  'Electrical / Electronic',
  'Civil',
  'Chemical',
  'Computer',
  'Mechatronics',
  'Petroleum',
  'Industrial / Production',
]

export const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu']

export const popularDisciplines = ['Mechanical', 'Electrical', 'Civil', 'Chemical', 'Petroleum']

/** Cycled through the search placeholder while the field is idle. */
export const searchExamples = [
  'Mechanical SIWES in Abuja',
  'Civil site intern in Port Harcourt',
  'Electrical trainee in Lagos',
  'Petroleum intern in Warri',
  'Chemical process intern in Kano',
]

export const heroPoints = [
  'Every engineering discipline',
  'CAC-verified companies',
  'One profile, every application',
  'Live status updates',
]

/* -------------------------------------------------------------------------- */
/*                                  Trust band                                */
/* -------------------------------------------------------------------------- */

export interface TrustLogo {
  name: string
  /** Lighter second half of the wordmark. */
  suffix?: string
  /** Brand-blue punctuation after the name. */
  mark?: string
  italic?: boolean
}

export const trustLogos: TrustLogo[] = [
  { name: 'Waterway', mark: '·' },
  { name: "Dephanny's", suffix: ' Venture' },
  { name: 'Origin', suffix: ' Civil' },
  { name: 'northgate', italic: true },
  { name: 'LAGOON', mark: '.' },
  { name: '◆ Meridian' },
  { name: 'Beacon/Co' },
]

/* -------------------------------------------------------------------------- */
/*                                 How it works                               */
/* -------------------------------------------------------------------------- */

export const howSteps = [
  { title: 'Search', description: 'Browse verified openings by course and location.' },
  { title: 'Apply', description: 'Send your profile and CV, no forms to repeat.' },
  { title: 'Get placed', description: 'Track every step until a company says yes.' },
]

/* -------------------------------------------------------------------------- */
/*                                 For students                               */
/* -------------------------------------------------------------------------- */

export interface StudentMatch {
  student: { name: string; course: string; photo: string }
  company: { name: string; initial?: string }
  role: { title: string; meta: string }
}

export const studentMatches: StudentMatch[] = [
  {
    student: {
      name: 'Tunde Bakare',
      course: 'Civil Engineering · 400L',
      photo:
        'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=128&h=128&fit=crop&crop=faces,center&auto=format&q=80',
    },
    company: { name: "Depahnny's Venture", initial: 'D' },
    role: { title: 'Civil Engineering Intern', meta: 'Lagos, Nigeria · 6-month IT' },
  },
  {
    student: {
      name: 'Chiamaka Obi',
      course: 'Electrical Engineering · 300L',
      photo:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces,center&auto=format&q=80',
    },
    company: { name: 'Julius Berger' },
    role: { title: 'Electrical SIWES Trainee', meta: 'Abuja, Nigeria · 4-month IT' },
  },
]

/* -------------------------------------------------------------------------- */
/*                                For companies                               */
/* -------------------------------------------------------------------------- */

export const companySteps = [
  { title: 'Post a role', description: 'Discipline, level, location, duration. Takes a couple of minutes.' },
  {
    title: 'Get matched applicants',
    description: 'Students see your role only if it fits their course, so every application is relevant.',
  },
  {
    title: 'Shortlist and hire',
    description: 'Compare profiles side by side and message candidates without leaving Fixth.',
  },
]

export const companyPerks = ['Free to post', 'Matched by discipline and level', 'One place for every applicant']

/* -------------------------------------------------------------------------- */
/*                                      FAQ                                   */
/* -------------------------------------------------------------------------- */

export const faqs = [
  {
    q: 'Do I need a school email to sign up?',
    a: "A school email speeds verification up, but it isn't required. If you don't have one, sign up with a personal email and upload your student ID — our team manually verifies you, usually within a day.",
  },
  {
    q: 'Is Fixth really free for students?',
    a: 'Yes. Creating a profile, applying to any opening, and tracking your applications is free. There is no premium tier for students.',
  },
  {
    q: 'What makes a company "verified"?',
    a: 'Every company submits a valid CAC registration number and completes a company profile. Our admin team reviews each one before any listing becomes visible to students.',
  },
  {
    q: 'Which courses can use Fixth?',
    a: 'Fixth is built for engineering students. Every discipline — Mechanical, Electrical / Electronic, Civil, Chemical, Computer, Mechatronics, Petroleum, Industrial / Production and the rest — can apply where companies accept them.',
  },
  {
    q: 'How do I know a company has seen my application?',
    a: 'Your dashboard shows a live status for every application — Submitted, Viewed, Shortlisted, Rejected or Accepted. You also get a notification the moment a company updates it.',
  },
  {
    q: 'Can I apply to opportunities outside my discipline?',
    a: 'Companies choose the eligible disciplines for each listing. Where a listing is open, you can apply; where a discipline restriction exists, Fixth will tell you upfront rather than wasting your time.',
  },
  {
    q: 'How is my data protected?',
    a: 'Passwords are encrypted, CVs and IDs are stored on secure, access-controlled storage, and only verified companies you apply to can see your profile. You can delete your account and data at any time.',
  },
]

/* -------------------------------------------------------------------------- */
/*                                    Footer                                  */
/* -------------------------------------------------------------------------- */

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Students',
    links: [
      { label: 'Create profile', href: routes.studentSignUp },
      { label: 'Browse openings', href: routes.discover },
      { label: 'How it works', href: '#how' },
      { label: 'Help & FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Companies',
    links: [
      { label: 'Post a placement', href: routes.companySignUp },
      { label: 'For companies', href: '#companies' },
      { label: 'Book a demo', href: `${routes.contact}?subject=Demo` },
      { label: 'Sign in', href: routes.signIn },
    ],
  },
  {
    title: 'Fixth',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
      { label: 'Contact', href: routes.contact },
    ],
  },
]
