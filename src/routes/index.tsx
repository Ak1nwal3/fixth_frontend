import { createBrowserRouter, Navigate } from 'react-router'
import RootLayout from '@/components/layout/RootLayout'
import RequireStudentAuth from '@/features/auth/RequireStudentAuth'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import SignInPage from '@/features/auth/SignInPage'
import LandingPage from '@/features/landing/LandingPage'
import OnboardingPage from '@/features/onboarding/OnboardingPage'
import ProductLayout from '@/features/product/ProductLayout'
import { StudentDataProvider } from '@/features/product/StudentDataProvider'
import WorkspacesPage from '@/features/product/WorkspacesPage'
import { DiscoverPage, PlacementDetailPage, ApplicationsPage } from '@/features/product/StudentPlacements'
import { ProfilePage, EditProfilePage, ResumePage } from '@/features/product/StudentProfile'
import { CompanyPlacementsPage, PlacementEditorPage, ApplicantsPage, ApplicantReviewPage, CompanyProfilePage } from '@/features/product/CompanyPages'
import { VerificationQueuePage, VerificationReviewPage, ModerationPage, AccountsPage, AuditPage } from '@/features/product/AdminPages'
import NotFoundPage from '@/pages/NotFoundPage'
const studentWorkspace = (
  <RequireStudentAuth>
    <StudentDataProvider>
      <ProductLayout role="student" />
    </StudentDataProvider>
  </RequireStudentAuth>
)
export const router = createBrowserRouter([{ path: '/', element: <RootLayout />, children: [
  { index: true, element: <LandingPage /> },
  { path: 'onboarding/:track/:step?', element: <OnboardingPage /> },
  { path: 'auth/sign-in', element: <Navigate to="/auth/student/sign-in" replace /> },
  { path: 'auth/student/sign-in', element: <SignInPage accountType="student" /> },
  { path: 'auth/organization/sign-in', element: <SignInPage accountType="organization" /> },
  { path: 'auth/student/forgot-password', element: <SignInPage accountType="student" reset /> },
  { path: 'auth/organization/forgot-password', element: <SignInPage accountType="organization" reset /> },
  { path: 'auth/forgot-password', element: <Navigate to="/auth/student/forgot-password" replace /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
  { path: 'workspaces', element: <WorkspacesPage /> },
  { path: 'student', children: [
    // Public discovery routes: the placements API allows anonymous reads and
    // returns extra fields for signed-in students.
    { element: <ProductLayout role="student" />, children: [
      { index: true, element: <Navigate to="discover" replace /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'placements/:id', element: <PlacementDetailPage /> },
    ] },
    // Private student routes require a verified student session.
    { element: studentWorkspace, children: [
      { path: 'saved', element: <DiscoverPage savedOnly /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/edit', element: <EditProfilePage /> },
      { path: 'resume', element: <ResumePage /> },
    ] },
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
