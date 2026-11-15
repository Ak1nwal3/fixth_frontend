/**
 * Code-split page components. Kept apart from the router module so React Fast
 * Refresh sees a components-only file.
 */
import { lazy, type ComponentType } from 'react'

/** Code-split a named export so each workspace downloads only when visited. */
function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lazy(() => load().then(module => ({ default: module[name] as M[K] & ComponentType<any> })))
}

const studentPlacements = () => import('@/features/product/StudentPlacements')
const studentProfile = () => import('@/features/product/StudentProfile')
const companyPlacements = () => import('@/features/product/CompanyPlacements')
const companyApplicants = () => import('@/features/product/CompanyApplicants')
const adminPages = () => import('@/features/product/AdminPages')

export const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
export const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'))
export const SignInPage = lazy(() => import('@/features/auth/SignInPage'))
export const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'))
export const WorkspacesPage = lazy(() => import('@/features/product/WorkspacesPage'))
export const DiscoverPage = lazyNamed(studentPlacements, 'DiscoverPage')
export const PlacementDetailPage = lazyNamed(studentPlacements, 'PlacementDetailPage')
export const ApplicationsPage = lazyNamed(studentPlacements, 'ApplicationsPage')
export const ApplicationDetailPage = lazyNamed(studentPlacements, 'ApplicationDetailPage')
export const ProfilePage = lazyNamed(studentProfile, 'ProfilePage')
export const EditProfilePage = lazyNamed(studentProfile, 'EditProfilePage')
export const ResumePage = lazyNamed(studentProfile, 'ResumePage')
export const CompanyPlacementsPage = lazyNamed(companyPlacements, 'CompanyPlacementsPage')
export const PlacementEditorPage = lazyNamed(companyPlacements, 'PlacementEditorPage')
export const ApplicantsPage = lazyNamed(companyApplicants, 'ApplicantsPage')
export const ApplicantReviewPage = lazyNamed(companyApplicants, 'ApplicantReviewPage')
export const CompanyProfilePage = lazyNamed(() => import('@/features/product/CompanyProfile'), 'CompanyProfilePage')
export const AdminWorkspace = lazyNamed(adminPages, 'AdminWorkspace')
export const VerificationQueuePage = lazyNamed(adminPages, 'VerificationQueuePage')
export const VerificationReviewPage = lazyNamed(adminPages, 'VerificationReviewPage')
export const ModerationPage = lazyNamed(adminPages, 'ModerationPage')
export const AccountsPage = lazyNamed(adminPages, 'AccountsPage')
export const AuditPage = lazyNamed(adminPages, 'AuditPage')
