import { avatars, companyLogos, photos } from '@/assets'

/* -------------------------------------------------------------------------- */
/*                                   Navigation                               */
/* -------------------------------------------------------------------------- */

export interface NavLink {
  label: string
  /** In-page anchor (`#…`) or an app route (`/…`); the navbar picks the right element. */
  href: string
}

export const navLinks: NavLink[] = [
  { label: 'Students', href: '#students' },
  { label: 'Companies', href: '#companies' },
  { label: 'Internship', href: '#internship' },
  { label: 'Organisation', href: '/onboarding/organization/email' },
]

/* -------------------------------------------------------------------------- */
/*                                      Hero                                  */
/* -------------------------------------------------------------------------- */

export const hero = {
  /** Rendered uppercase; the design sets the two lines explicitly. */
  headlineLines: ['Lets get you your', 'next INTERNSHIP role'],
  subheadline:
    'Connecting engineering students to SIWES placements, internships, jobs, and opportunities in Nigeria.',
  searchPlaceholder: 'Find your next internship..',
  filters: ['Remote', 'Hybrid', 'On-site'] as const,
}

/* -------------------------------------------------------------------------- */
/*                              Platform features                             */
/* -------------------------------------------------------------------------- */

export type MockupKind = 'placements' | 'training' | 'internships'

export interface PlatformFeature {
  id: string
  title: string
  description: string
  cta: string
  mockup: MockupKind
}

export const platformFeatures: PlatformFeature[] = [
  {
    id: 'swes-placements',
    title: 'SIWES Placements',
    description: 'Find verified SIWES placements that match your discipline.',
    cta: 'Get Started',
    mockup: 'placements',
  },
  {
    id: 'industrial-training',
    title: 'Industrial Training',
    description: 'Discover structured industrial training opportunities across Nigeria.',
    cta: 'Learn more',
    mockup: 'training',
  },
  {
    id: 'internships',
    title: 'Internships',
    description: 'Apply to internship opportunities from verified engineering companies.',
    cta: 'Apply',
    mockup: 'internships',
  },
]

/* -------------------------------------------------------------------------- */
/*                                    CTA                                     */
/* -------------------------------------------------------------------------- */

export const cta = {
  heading: 'Ready to land your internship faster?',
  description:
    'Join thousands of engineering students building their careers through verified opportunities.',
  action: 'Sign up',
}

/* -------------------------------------------------------------------------- */
/*                                    Footer                                  */
/* -------------------------------------------------------------------------- */

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'For students',
    links: [
      { label: 'Get Started Free', href: '#' },
      { label: 'Find Jobs', href: '#internship' },
      { label: 'Success Stories', href: '#' },
      { label: 'FAQs', href: '#' },
    ],
  },
  {
    title: 'For companies',
    links: [
      { label: 'Post a Job', href: '#' },
      { label: 'Search Talent', href: '#students' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Who We Are', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog (coming soon)', href: '#' },
      { label: 'Engineering News', href: '#' },
      { label: 'Career Tips', href: '#' },
    ],
  },
]

export interface SocialLink {
  label: string
  href: string
  icon: 'x' | 'linkedin' | 'instagram'
}

export const socials: SocialLink[] = [
  { label: 'Fixth on X', href: '#', icon: 'x' },
  { label: 'Fixth on LinkedIn', href: '#', icon: 'linkedin' },
  { label: 'Fixth on Instagram', href: '#', icon: 'instagram' },
]

export const legalLinks: NavLink[] = [
  { label: 'Terms of service', href: '#' },
  { label: 'Privacy policy', href: '#' },
  { label: 'Cookie policy', href: '#' },
]

/* -------------------------------------------------------------------------- */
/*                                  Mockup data                               */
/* -------------------------------------------------------------------------- */

export interface JobCard {
  company: string
  logo: string
  role: string
  location: string
  contract: string
}

export const jobCards: JobCard[] = [
  {
    company: 'Waterway Steel',
    logo: companyLogos.waterwaySteel,
    role: 'Mechanical Engineer',
    location: 'Abuja, Nigeria',
    contract: 'Full-time',
  },
  {
    company: 'Waterway Steel',
    logo: companyLogos.waterwaySteel,
    role: 'Mechanical Engineer',
    location: 'Abuja, Nigeria',
    contract: 'Internship',
  },
  {
    company: 'Origin Steel',
    logo: companyLogos.originSteel,
    role: 'Electrical Engineer',
    location: 'Lagos, Nigeria',
    contract: 'Full-time',
  },
]

export interface Candidate {
  name: string
  field: string
  avatar: string
}

export const candidates: Candidate[] = [
  { name: 'John Doe', field: 'Mechanical Engineering', avatar: avatars.johnDoe },
  { name: 'Sarah Jones', field: 'Software Engineering', avatar: avatars.sarahJones },
  { name: 'Matthew Edgar', field: 'Civil Engineering', avatar: avatars.matthewEjeo },
]

export const candidateStageLabel = 'Hired'

export const internshipChat = {
  received:
    'Hey, i saw your profile and we are interested which time would you be available for a call?',
  sent: 'Okay that would be great!',
  photos: [photos.interviewer, photos.candidate],
}
