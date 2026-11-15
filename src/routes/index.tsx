import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import RootLayout from '@/components/layout/RootLayout'
import RequireCompanyAuth from '@/features/auth/RequireCompanyAuth'
import RequireStudentAuth from '@/features/auth/RequireStudentAuth'
import HomePage from '@/features/home/HomePage'
import ProductLayout from '@/features/product/ProductLayout'
import { StudentDataProvider } from '@/features/product/StudentDataProvider'
import NotFoundPage from '@/pages/NotFoundPage'
import { env } from '@/config/env'
import {
  LandingPage,
  OnboardingPage,
  SignInPage,
  ResetPasswordPage,
  WorkspacesPage,
  DiscoverPage,
  PlacementDetailPage,
  ApplicationsPage,
  ApplicationDetailPage,
  ProfilePage,
  EditProfilePage,
  ResumePage,
  CompanyPlacementsPage,
  PlacementEditorPage,
  ApplicantsPage,
  ApplicantReviewPage,
  CompanyProfilePage,
  AdminWorkspace,
  VerificationQueuePage,
  VerificationReviewPage,
  ModerationPage,
  AccountsPage,
  AuditPage,
} from './pages'


export const router = createBrowserRouter([{ path: '/', element: <RootLayout />, children: [
  { index: true, element: <HomePage /> },
  { path: 'old', element: <LandingPage /> },
  { path: 'onboarding/:track/:step?', element: <OnboardingPage /> },
  { path: 'auth/sign-in', element: <Navigate to="/auth/student/sign-in" replace /> },
  { path: 'auth/student/sign-in', element: <SignInPage accountType="student" /> },
  { path: 'auth/organization/sign-in', element: <SignInPage accountType="organization" /> },
  { path: 'auth/student/forgot-password', element: <SignInPage accountType="student" reset /> },
  { path: 'auth/organization/forgot-password', element: <SignInPage accountType="organization" reset /> },
  { path: 'auth/forgot-password', element: <Navigate to="/auth/student/forgot-password" replace /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
  { path: 'workspaces', element: <WorkspacesPage /> },
  // One student layout for public and private pages, so moving between
  // Discover, a placement, and Applications keeps the shell and profile loaded.
  { element: <StudentDataProvider><ProductLayout role="student" /></StudentDataProvider>, children: [
    { path: 'student', children: [
      // Public discovery routes: the placements API allows anonymous reads and
      // returns extra fields for signed-in students.
      { index: true, element: <Navigate to="discover" replace /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'placements/:id', element: <PlacementDetailPage /> },
      // Private student routes require a verified student session.
      { element: <RequireStudentAuth><Outlet /></RequireStudentAuth>, children: [
        { path: 'saved', element: <DiscoverPage savedOnly /> },
        { path: 'applications', element: <ApplicationsPage /> },
        { path: 'applications/:id', element: <ApplicationDetailPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'profile/edit', element: <EditProfilePage /> },
        { path: 'resume', element: <ResumePage /> },
      ] },
    ] },
    { path: 'p/:slug', element: <PlacementDetailPage /> },
  ] },
  { path: 'company', element: <RequireCompanyAuth><ProductLayout role="company" /></RequireCompanyAuth>, children: [
    { index: true, element: <Navigate to="placements" replace /> },
    { path: 'placements', element: <CompanyPlacementsPage /> },
    { path: 'placements/new', element: <PlacementEditorPage key="new" /> },
    { path: 'placements/:id/edit', element: <PlacementEditorPage /> },
    { path: 'placements/:id/applicants', element: <ApplicantsPage /> },
    { path: 'placements/:id/applicants/:applicationId', element: <ApplicantReviewPage /> },
    { path: 'applicants', element: <ApplicantsPage /> },
    { path: 'applicants/:applicationId', element: <ApplicantReviewPage /> },
    { path: 'profile', element: <CompanyProfilePage /> },
  ] },
  // The Trust & Safety workspace is an unauthenticated local mock with sample
  // data, so production builds leave it out unless VITE_SHOW_ADMIN_PREVIEW=true.
  ...(env.showAdminPreview ? [{ path: 'admin', element: <AdminWorkspace />, children: [
    { index: true, element: <Navigate to="verification" replace /> },
    { path: 'verification', element: <VerificationQueuePage /> },
    { path: 'verification/:type/:id', element: <VerificationReviewPage /> },
    { path: 'listings', element: <ModerationPage /> },
    { path: 'accounts', element: <AccountsPage /> },
    { path: 'audit', element: <AuditPage /> },
  ] }] : []),
  { path: '*', element: <NotFoundPage /> },
] }])
