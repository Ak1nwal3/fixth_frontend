import { createBrowserRouter, Navigate } from 'react-router'
import RootLayout from '@/components/layout/RootLayout'
import SignInPage from '@/features/auth/SignInPage'
import LandingPage from '@/features/landing/LandingPage'
import OnboardingPage from '@/features/onboarding/OnboardingPage'
import ProductLayout from '@/features/product/ProductLayout'
import WorkspacesPage from '@/features/product/WorkspacesPage'
import { DiscoverPage, PlacementDetailPage, ApplicationsPage } from '@/features/product/StudentPlacements'
import { ProfilePage, EditProfilePage, ResumePage } from '@/features/product/StudentProfile'
import { CompanyPlacementsPage, PlacementEditorPage, ApplicantsPage, ApplicantReviewPage, CompanyProfilePage } from '@/features/product/CompanyPages'
import { VerificationQueuePage, VerificationReviewPage, ModerationPage, AccountsPage, AuditPage } from '@/features/product/AdminPages'
import NotFoundPage from '@/pages/NotFoundPage'
export const router = createBrowserRouter([{ path: '/', element: <RootLayout />, children: [
  { index: true, element: <LandingPage /> },
  { path: 'onboarding/:track/:step?', element: <OnboardingPage /> },
  { path: 'auth/sign-in', element: <SignInPage /> },
  { path: 'auth/forgot-password', element: <SignInPage reset /> },
  { path: 'workspaces', element: <WorkspacesPage /> },
  { path: 'student', element: <ProductLayout role="student" />, children: [
    { index: true, element: <Navigate to="discover" replace /> },
    { path: 'discover', element: <DiscoverPage /> },
    { path: 'saved', element: <DiscoverPage savedOnly /> },
    { path: 'applications', element: <ApplicationsPage /> },
    { path: 'placements/:id', element: <PlacementDetailPage /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'profile/edit', element: <EditProfilePage /> },
    { path: 'resume', element: <ResumePage /> },
  ] },
  { path: 'p/:slug', element: <ProductLayout role="student" />, children: [{ index: true, element: <PlacementDetailPage /> }] },
  { path: 'company', element: <ProductLayout role="company" />, children: [
    { index: true, element: <Navigate to="placements" replace /> },
    { path: 'placements', element: <CompanyPlacementsPage /> },
    { path: 'placements/new', element: <PlacementEditorPage key="new" /> },
    { path: 'placements/:id/edit', element: <PlacementEditorPage /> },
    { path: 'placements/:id/applicants', element: <ApplicantsPage /> },
    { path: 'placements/:id/applicants/:candidateId', element: <ApplicantReviewPage /> },
    { path: 'applicants', element: <ApplicantsPage /> },
    { path: 'profile', element: <CompanyProfilePage /> },
  ] },
  { path: 'admin', element: <ProductLayout role="admin" />, children: [
    { index: true, element: <Navigate to="verification" replace /> },
    { path: 'verification', element: <VerificationQueuePage /> },
    { path: 'verification/:type/:id', element: <VerificationReviewPage /> },
    { path: 'listings', element: <ModerationPage /> },
    { path: 'accounts', element: <AccountsPage /> },
    { path: 'audit', element: <AuditPage /> },
  ] },
  { path: '*', element: <NotFoundPage /> },
] }])
