# Fixth Backend Specification — Endpoints

> **Status:** All endpoints below are **inferred**. The frontend currently makes no HTTP calls: `src/services/http.ts` defines `request()` but nothing imports it. Sources cite the UI operation, mock data, or comment that implies each endpoint.
>
> **Implemented contract:** see [`api-reference.md`](./api-reference.md) for the endpoints that already exist. Use that document for frontend integration; this file remains the wider product specification.

## API conventions

- **Canonical base URL:** `http://localhost:8000/api/v1`. Recommended frontend setting: `VITE_API_URL=http://localhost:8000/api/v1`, then call `request('/placements/')`.
  - `.env.example` and the client fallback both use `http://localhost:8000/api/v1` / `/api/v1`; legacy `/api` routes are not exposed.
- **Trailing slashes:** DRF default; keep `APPEND_SLASH=True`.
- **IDs:** UUID strings. **Slugs are stable** and must not change when a title changes (`README.md:101`).
- **Dates:** ISO 8601 UTC strings (`applied_at`, `created_at`, etc.). The frontend formats with `toLocaleDateString('en-GB')` (`src/features/product/data.ts:55`).
- **Money:** return both numeric `stipend_amount`/`currency` and display `stipend` (e.g. `"₦180,000"`) because the UI renders a string (`src/features/product/data.ts:4`).
- **Pagination:** `{count, next, previous, results}`; default `page_size=20`, max `100`. The current UI expects plain arrays, so the frontend must switch to `.results`.
- **Error contract:** `{detail: string, code?: string, errors?: {field: [message]}}`.
- **Status codes:** `400` validation, `401` missing/invalid token, `403` role/object denied, `404` not found, `409` duplicate/illegal state, `410` expired/closed, `413` file too large, `415` wrong media type, `429` throttled.
- **Auth roles:** `student`, `company`, `admin`. Public = no auth. “Optional” means anonymous reads work but extra fields (`match`, `is_saved`, `has_applied`) require a student token.

## Shared response shapes

| Shape | Fields |
|---|---|
| `CompanySummary` | `id, name, slug, logo_url, verification_status` |
| `Placement` | `id, slug, title, company (string name), company_id, company_slug, company_logo_url, company_verified, location, work_style, duration, discipline, level, stipend, stipend_amount, currency, description, responsibilities, requirements, status, reports, match, is_saved, has_applied, published_at, created_at, updated_at` |
| `PlacementDetail` | `Placement` + `eligibility {eligible, reason, required_level, required_discipline}` + `can_apply` |
| `DocumentMeta` | `id, name, size, mime, url, uploaded_at` |
| `StudentProfile` | `id, user_id, email, first_name, last_name, phone, location, institution, discipline, level, graduation_year, student_id, start_date, duration, work_styles[], portfolio, skills[], interests, resume (DocumentMeta or null), photo_url, verification_status, risk_level, profile_strength, created_at, updated_at` |
| `Application` | `id, placement (UUID), placement_detail (Placement), student (UUID), student_detail (StudentProfile subset), status, applied_at, status_changed_at, resume (DocumentMeta or null), events[]` |
| `Company` | `id, name, slug, website, industry, description, country, city, address, logo_url, registration_number, primary_contact_name, primary_contact_title, verification_status, risk_level` |
| `VerificationRequest` | `id, kind, subject_id, subject_label, risk_level, status, submitted_at, decided_at, decided_by, decision_reason, evidence[]` |
| `AuditEntry` | `id, action, action_display, subject_type, subject_id, subject_label, reason, actor, metadata, created_at` |
| `Paginated<T>` | `count, next, previous, results[]` |

**Frontend → API field mapping:** `workStyle`→`work_style`, `placementId`→`placement`, `firstName`/`lastName`→`first_name`/`last_name`, `studentId`→`student_id`, `graduation`→`graduation_year`, `date`→`applied_at`, `reports`→`reports_count`, `verification`→`verification_status`, `risk`→`risk_level`, `match`→`match_score`, `resume`→`resume.name`, `photo`→`photo_url`.

---

## A. Authentication, OTP, password reset

> **Role-scoped auth:** student auth lives under `/api/v1/auth/student/...` and organization auth under `/api/v1/auth/organization/...`. Each role has the same subpaths: `sign-in/`, `refresh/`, `sign-out/`, `password-reset/`, `password-reset/confirm/`, and `me/`. The generic `/api/v1/auth/...` sign-in, refresh, sign-out, password-reset, confirm, and `me` routes are administrator-only. A3–A9 describe the shared shape; prefix each path with the correct role namespace.

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| A1 | `POST /api/v1/auth/otp/request/` | Send 6-digit code to onboarding email | Public | `{email, track: "student" or "organization"}` → `202 {detail, expires_in: 600, resend_after: 60}` | `400` invalid email/track, `409` email already registered, `429` throttled, `503` mail provider failure | `src/features/onboarding/OnboardingPage.tsx:87`, `src/features/onboarding/flow.ts:5-6` |
| A2 | `POST /api/v1/auth/otp/verify/` | Verify 6 digits and issue a registration token or session | Public | `{email, track, code: "123456"}` → `200 {verification_token, is_new_user, access?, refresh?, user?}` | `400` wrong code, `404` no active code, `410` expired, `429` too many attempts | `OnboardingPage.tsx:41,82`, `VerificationCode.tsx:1-13` |
| A3 | `POST /api/v1/auth/sign-in/` | Email/password login for all roles | Public | `{email, password}` → `200 {access, refresh, user: {id, email, role, student_profile_id?, company_id?}}` | `401` bad credentials, `403` suspended, `429` throttled | `SignInPage.tsx:10-13` |
| A4 | `POST /api/v1/auth/refresh/` | Rotate access token | Public | `{refresh}` → `200 {access, refresh?}` | `401` invalid/blacklisted | Inferred (SimpleJWT) |
| A5 | `POST /api/v1/auth/sign-out/` | Blacklist refresh token | Any | `{refresh}` → `204` | `401` | Inferred from `ProductLayout.tsx:31` sign-out link |
| A6 | `POST /api/v1/auth/password-reset/` | Send reset link/code | Public | `{email}` → `202 {detail}` always (no account enumeration) | `429` throttled | `SignInPage.tsx:10-12` |
| A7 | `POST /api/v1/auth/password-reset/confirm/` | Complete reset | Public | `{uid, token, new_password}` → `204` | `400` invalid/expired token, weak password | Inferred (reset link is mentioned, not implemented) |
| A8 | `GET /api/v1/auth/me/` | Restore session/profile envelope | Any | — → `200 {user}` | `401` | Inferred from `App.tsx:8-12` auth-provider comment |
| A9 | `PATCH /api/v1/auth/me/` | Change email/name/password | Any | partial user fields → `200 {user}` | `400`, `409` email taken | Inferred, not currently in UI |

**Important:** the onboarding forms collect **no password** (`flow.ts:8-18`, `OnboardingPage.tsx:43-51`), while sign-in requires one (`SignInPage.tsx:13`). Either add a password step, create accounts with an unusable password and send a “set password” link, or use magic-link sign-in. See `open-questions.md` Q3.

## B. Onboarding completion

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| B1 | `POST /api/v1/onboarding/students/complete/` | Create student account + profile from final review | `verification_token` | `multipart/form-data`: `first_name, last_name, phone, institution, discipline/course, level, start_date, duration, work_style[], location, skills[], photo (file), school_id_document (file)` → `201 {user, student, access, refresh}` | `400` missing/invalid, `409` email already used, `413` too large, `415` bad MIME | `flow.ts:12-18`, `OnboardingPage.tsx:43-52,68-74,83` |
| B2 | `POST /api/v1/onboarding/organizations/complete/` | Create company account + company from final review | `verification_token` | `multipart/form-data`: `organization_name, website, industry, description, country, city, address, work_email, logo (file)` → `201 {user, company, access, refresh}` | `400`, `409`, `413`, `415` | `flow.ts:8-11`, `OnboardingPage.tsx:43-52,68-74` |
| B3 | `PATCH /api/v1/onboarding/draft/` | Optional server-side draft sync between steps | `verification_token` | partial draft fields → `200 {draft}` | `400`, `401` | Optional; current app uses `sessionStorage` (`flow.ts:20-21`) |

B1/B2 should mark the new profile/company `verification_status="Pending"` and create a `VerificationRequest`.

## C. Reference data, facets, public company info

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| C1 | `GET /api/v1/skills/?search=` | Skill picker list; canonical rows are created on demand from profile writes | Public | → `200 [{id,name,slug}]` (max 50) | — | `OnboardingPage.tsx:83` |
| C2 | `GET /api/v1/disciplines/?search=` | Canonical discipline list; rows are created on demand from profile/placement writes | Public | → `200 [{id,name,slug}]` (max 50) | — | `StudentPlacements.tsx:25-27`, `flow.ts:15` |
| C3 | `GET /api/v1/placements/facets/` | Filter dropdown values | Public | → `200 {disciplines[], locations[], durations[], work_styles[]}` | — | `StudentPlacements.tsx:25-27` derives them from placements |
| C4 | `GET /api/v1/companies/{slug}/` | Public company summary for placement pages | Public | → `200 Company` (public subset) | `404` | `StudentPlacements.tsx:11,52`, `CompanyPages.tsx:54-56` |
| C5 | `GET /api/v1/public/landing/` | Marketing job cards/featured placements | Public | → `200 {job_cards[], candidates[], internship_chat}` | — | Optional; currently hardcoded `landing/data.ts:158-200` |

C5 is not required for the app to function; the landing page is static.

The backend exposes C1/C2 at `/api/v1/skills/` and `/api/v1/disciplines/`.

## D. Student placement discovery and saved roles

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| D1 | `GET /api/v1/placements/` | Discover active placements | Optional | query: `q, discipline, location, duration, work_style (repeatable/comma), saved=true, sort=match or title, page, page_size` → `200 Paginated<Placement>` | `400` invalid sort | `StudentPlacements.tsx:13-39`, `HeroSearch.tsx:22-30` |
| D2 | `GET /api/v1/placements/{slug}/` | Placement detail by canonical slug | Optional | → `200 PlacementDetail` | `404`, `410` if Draft/Unpublished for non-owner | `StudentPlacements.tsx:41-52`, `routes/index.tsx:29` |
| D3 | `GET /api/v1/placements/by-id/{id}/` | Detail by UUID (used by `/student/placements/:id`) | Optional | → `200 PlacementDetail` | `404` | `routes/index.tsx:24`, `StudentPlacements.tsx:46` |
| D4 | `POST /api/v1/placements/{id}/save/` | Save role | Student | `{}` → `201 {saved: true}` | `401`, `404`, `409` already saved | `store.tsx:36`, `StudentPlacements.tsx:11` |
| D5 | `DELETE /api/v1/placements/{id}/save/` | Unsave role | Student | → `204` | `401`, `404` | `store.tsx:36` |
| D6 | `GET /api/v1/students/me/saved-placements/` | Saved list alias | Student | → `200 Paginated<Placement>` | `401` | `StudentPlacements.tsx:13,23` (savedOnly) |
| D7 | `POST /api/v1/placements/{id}/report/` | Report a listing | Student | `{reason, details}` → `201 {report}` | `401`, `404`, `409` duplicate open report | Inferred from `reports` field (`data.ts:5`, `AdminPages.tsx:51`) — no reporting UI exists yet |

D1 behavior:

- Default scope is `status="Active"` for students/anonymous.
- `saved=true` requires a student token and filters to the caller’s saved roles.
- `sort=match` orders by the computed match score descending; `sort=title` is A–Z.
- Search currently matches `title + company + discipline` (`StudentPlacements.tsx:23`), not skills. Keep that behavior or extend intentionally.
- Work-style chips come from `?styles=Remote,Hybrid` (`HeroSearch.tsx:28`); map `styles` → `work_style` in the frontend service layer.

D2/D3 must include:

- `is_saved`, `has_applied` for the current student.
- `eligibility` using **exact, case-insensitive discipline match AND student level >= placement level** (`StudentPlacements.tsx:49`).
- `can_apply` = eligible AND active AND resume exists AND not already applied AND profile not deleted (`StudentPlacements.tsx:48-51`).

## E. Applications (student)

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| E1 | `POST /api/v1/applications/` | One-click apply | Student | `{placement: uuid, resume?: document_id}` → `201 Application` | `400` no resume, `401`, `403` ineligible/deleted profile, `404`, `409` already applied, `410` closed/expired | `store.tsx:37`, `StudentPlacements.tsx:48-52` |
| E2 | `GET /api/v1/applications/?status=&placement=&page=` | Student application list | Student | → `200 Paginated<Application>` | `401` | `StudentPlacements.tsx:54-59` |
| E3 | `GET /api/v1/applications/{id}/` | Application detail | Owner / company / admin | → `200 Application` | `401`, `403`, `404` | `StudentPlacements.tsx:59` |
| E4 | `GET /api/v1/applications/summary/` | Metrics: total, viewed, shortlisted, accepted | Student | → `200 {total, submitted, viewed, shortlisted, accepted, rejected}` | `401` | `StudentPlacements.tsx:59` |
| E5 | `GET /api/v1/applications/{id}/events/` | Status timeline | Owner / company / admin | → `200 [ApplicationEvent]` | `401`, `403` | Inferred from status rail (`StudentPlacements.tsx:59`) |
| E6 | `POST /api/v1/applications/{id}/withdraw/` | Future withdrawal | Student | → `200 Application` | `400` illegal state | Inferred; no UI |

E1 must enforce the same eligibility and resume rules the UI displays. The UI currently also requires a live `resumeFile` object (`StudentPlacements.tsx:51`), which does not survive refresh; the backend should treat a stored resume document as sufficient and the frontend must stop requiring the local `File`.

## F. Student profile, photo, resume, verification

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| F1 | `GET /api/v1/students/me/` | Current student profile | Student | → `200 StudentProfile` | `401` | `StudentProfile.tsx:14-20` |
| F2 | `PATCH /api/v1/students/me/` | Edit profile | Student | partial: `first_name, last_name, email, phone, location, institution, discipline, level, graduation_year, student_id, duration, work_styles[], portfolio, skills[], interests` → `200 StudentProfile` | `400`, `401`, `409` email taken | `StudentProfile.tsx:22-41`, `store.tsx:35` |
| F3 | `DELETE /api/v1/students/me/` | Delete account and data | Student | → `204` | `401` | `StudentProfile.tsx:14-20`, `store.tsx:47` |
| F4 | `POST /api/v1/students/me/photo/` | Upload profile photo | Student | multipart `photo` (PNG/JPEG/WebP, ≤2 MB) → `200 {photo_url, photo: DocumentMeta}` | `400` bad type, `413` too large, `415` | `StudentProfile.tsx:41` |
| F5 | `DELETE /api/v1/students/me/photo/` | Remove photo | Student | → `204` | `401`, `404` | Inferred |
| F6 | `GET /api/v1/students/me/resume/` | Active resume metadata | Student | → `200 DocumentMeta` | `404` none | `StudentProfile.tsx:43-64` |
| F7 | `POST /api/v1/students/me/resume/` | Upload/replace active resume | Student | multipart `file` (PDF/DOC/DOCX, ≤5 MB) → `201 DocumentMeta` | `400` bad ext, `413` too large, `415` | `StudentProfile.tsx:48-63` |
| F8 | `DELETE /api/v1/students/me/resume/` | Remove active resume | Student | → `204` | `401`, `404` | Inferred |
| F9 | `GET /api/v1/documents/{id}/download/` | Authorized file stream/redirect | Owner / authorized company / admin | → `200` file or `302` signed URL | `401`, `403`, `404` | `ui.tsx:59-69`, `CompanyPages.tsx:52` |
| F10 | `POST /api/v1/students/me/verification/` | Submit student ID/enrollment evidence | Student | multipart `documents[]` → `202 VerificationRequest` | `400`, `413`, `415` | Inferred from `AdminPages.tsx:28-30`, `OnboardingPage.tsx:68-74` |
| F11 | `GET /api/v1/students/{id}/` | Applicant profile for company/admin | Company / admin | → `200 StudentProfile` (privacy subset) | `401`, `403`, `404` | `CompanyPages.tsx:43-52`, `AdminPages.tsx:16-30` |

Photo and resume must be **replaced by creating a new Document**, not overwriting bytes, so existing applications keep the resume version they were submitted with. Resume files are private; do not serve them from a public `/media/` path.

## G. Company profile and placement management

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| G1 | `GET /api/v1/companies/me/` | Current company profile | Company | → `200 Company` | `401`, `403` | `CompanyPages.tsx:54-56` |
| G2 | `PATCH /api/v1/companies/me/` | Edit company profile/logo | Company | partial: `name, website, industry, description, country, city, address, registration_number, primary_contact_name, primary_contact_title, logo (file)` → `200 Company` | `400`, `413`, `415` | Inferred from company profile UI and onboarding |
| G3 | `GET /api/v1/company/placements/?status=&q=&sort=&page=` | Own company listings | Company | → `200 Paginated<Placement + applicants_count + new_applicants_count + shortlisted_count>` | `401`, `403` | `CompanyPages.tsx:8-14` |
| G4 | `POST /api/v1/company/placements/` | Create placement (draft or publish) | Company | `{title, location, work_style, duration, discipline, level, stipend_amount, currency, description, responsibilities, requirements, status: "Draft" or "Active"}` → `201 Placement` | `400`, `401`, `403` unverified company (policy), `409` duplicate slug | `CompanyPages.tsx:16-28`, `store.tsx:38` |
| G5 | `GET /api/v1/company/placements/{id}/` | Own placement detail | Company | → `200 Placement` | `403`, `404` | `CompanyPages.tsx:17-25` |
| G6 | `PATCH /api/v1/company/placements/{id}/` | Edit/save draft/publish | Company | partial placement fields + `status` → `200 Placement` | `400` incomplete publish, `403`, `404`, `409` illegal transition | `CompanyPages.tsx:26-28`, `store.tsx:38` |
| G7 | `POST /api/v1/company/placements/{id}/publish/` | Convenience publish action | Company | → `200 Placement` | `400` missing required fields, `403`, `409` | Optional; UI currently just sets `status="Active"` |
| G8 | `POST /api/v1/company/placements/{id}/close/` | Close listing; keep applicants | Company | → `200 Placement` (`status="Closed"`) | `403`, `404`, `409` already closed | `CompanyPages.tsx:14` |
| G9 | `DELETE /api/v1/company/placements/{id}/` | Delete a draft | Company | → `204` | `403`, `404`, `409` has applications | Inferred; no delete UI |
| G10 | `GET /api/v1/company/summary/` | Metrics: active, applicants, shortlisted, hired | Company | → `200 {active_placements, applicants, shortlisted, hired}` | `401` | `CompanyPages.tsx:14` |

G4/G6 rules:

- Server generates `id` and a stable `slug`; ignore client-supplied slugs. The UI uses `nova-${uuid.slice(0,10)}` (`CompanyPages.tsx:21`), but the backend should own this.
- Drafts may be incomplete. Publishing (`status="Active"`) requires all visible required fields (`title, description, responsibilities, requirements, discipline, level, location, duration, stipend`).
- `Draft → Active`, `Active → Closed`, `Closed → Active` (company reopen) are reasonable; `Unpublished` can only be changed by an admin. Define and enforce transitions.
- `Expired` is not set anywhere in the UI; derive it from `expires_at` or a background job.

## H. Company applicants

> **Implemented:** H1–H4 are live. The company list/detail/update endpoints are documented in [`api-reference.md`](./api-reference.md). H5 (gated contact details) remains planned.

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| H1 | `GET /api/v1/company/placements/{id}/applicants/?q=&status=&discipline=&page=` | Applicants for one listing | Company | → `200 Paginated<Application>` | `401`, `403`, `404` | `CompanyPages.tsx:30-41` |
| H2 | `GET /api/v1/company/applications/?q=&status=&discipline=&placement=&page=` | All applicants across company | Company | → `200 Paginated<Application>` | `400`, `401`, `403` | `CompanyPages.tsx:31` (`/company/applicants` route has no placement id) |
| H3 | `GET /api/v1/company/applications/{id}/` | Applicant review payload | Company | → `200 Application` with placement, student summary, resume metadata, and events | `401`, `403`, `404` | `CompanyPages.tsx:43-52` |
| H4 | `PATCH /api/v1/company/applications/{id}/` | Change application status | Company | `{status: "Viewed" or "Shortlisted" or "Accepted" or "Rejected", reason?}` → `200 Application` | `400` invalid status, `401`, `403`, `404`, `409` same/Submitted | `CompanyPages.tsx:43-52`, `store.tsx:39` |
| H5 | `GET /api/v1/company/applications/{id}/contact/` | Gated contact details | Company | → `200 {email, phone}` only when status is `Shortlisted` or `Accepted` | `403` not shortlisted/accepted, `404` | `CompanyPages.tsx:52` (contact modal) |

H4 status transitions: the implemented rule is that a company may set `Viewed`, `Shortlisted`, `Accepted`, or `Rejected` from any current status. `Submitted` is create-only, and setting the current status again returns `409`. Each change records an `ApplicationEvent` and sets `decided_by`.

H5 must enforce the gate server-side. Do not rely on the disabled button.

## I. Admin verification

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| I1 | `GET /api/v1/admin/verification-requests/?type=student or company&status=Pending&q=&risk=&page=` | Verification queue | Admin | → `200 Paginated<VerificationRequest>` + `summary {pending_students, pending_companies, needs_attention, approved_today}` | `401`, `403` | `AdminPages.tsx:8-14` |
| I2 | `GET /api/v1/admin/verification-requests/{id}/` | Review detail | Admin | → `200 VerificationRequest` + subject profile/company + evidence | `403`, `404` | `AdminPages.tsx:16-30` |
| I3 | `POST /api/v1/admin/verification-requests/{id}/decision/` | Approve/reject | Admin | `{decision: "approve" or "reject", reason}` (reason min 5 chars) → `200 VerificationRequest` | `400` missing/short reason, `403`, `404`, `409` already decided | `AdminPages.tsx:30`, `store.tsx:40-46` |
| I4 | `GET /api/v1/admin/verification-requests/summary/` | Queue metrics | Admin | → `200 {…}` | `401`, `403` | `AdminPages.tsx:14` |
| I5 | `GET /api/v1/admin/verification-requests/by-subject/{type}/{subject_id}/` | Alias matching `/admin/verification/:type/:id` | Admin | → `200 VerificationRequest` | `403`, `404` | `routes/index.tsx:43` |

I3 updates `StudentProfile.verification_status` or `Company.verification_status`, sets `decided_by`/`decided_at`, stores the reason, and writes an `AuditLog` action (`approve_verification`/`reject_verification`). The UI’s “Verified this session” metric filters audit entries (`AdminPages.tsx:14`); “approved today” is the server-side equivalent.

## J. Admin moderation, accounts, audit

| ID | Method & path | Purpose | Auth | Request → success | Errors | Source |
|---|---|---|---|---|---|---|
| J1 | `GET /api/v1/admin/placements/?q=&status=all or active or flagged or unpublished or closed or expired&page=` | Listing moderation | Admin | → `200 Paginated<Placement + company + reports>` + `summary {published, flagged, unpublished}` | `401`, `403` | `AdminPages.tsx:45-53` |
| J2 | `POST /api/v1/admin/placements/{id}/unpublish/` | Remove from discovery | Admin | `{reason}` → `200 Placement` (`status="Unpublished"`) | `400` missing reason, `403`, `404`, `409` already unpublished | `AdminPages.tsx:45-53`, `store.tsx:44` |
| J3 | `POST /api/v1/admin/placements/{id}/restore/` | Restore to active | Admin | `{reason}` → `200 Placement` (`status="Active"`) | `400`, `403`, `404`, `409` not unpublished | `AdminPages.tsx:45-53`, `store.tsx:44` |
| J4 | `GET /api/v1/admin/accounts/?q=&type=student or company&status=active or suspended&page=` | Account safety list | Admin | → `200 Paginated<Account {id,name,email,type,verification_status,status}>` + `summary {active_accounts, companies, suspended}` | `401`, `403` | `AdminPages.tsx:55-63` |
| J5 | `POST /api/v1/admin/accounts/{type}/{id}/suspend/` | Suspend student/company | Admin | `{reason}` → `200 Account` | `400`, `403`, `404`, `409` already suspended | `AdminPages.tsx:55-63`, `store.tsx:45` |
| J6 | `POST /api/v1/admin/accounts/{type}/{id}/restore/` | Restore account | Admin | `{reason}` → `200 Account` | `400`, `403`, `404`, `409` not suspended | `AdminPages.tsx:55-63`, `store.tsx:45` |
| J7 | `GET /api/v1/admin/audit-logs/?action=&subject_type=&subject_id=&date_from=&date_to=&page=` | Decision history | Admin | → `200 Paginated<AuditEntry>` | `401`, `403` | `AdminPages.tsx:65-68`, `store.tsx:40-46` |
| J8 | `GET /api/v1/admin/summary/` | Consolidated dashboard metrics | Admin | → `200 {…}` | `401`, `403` | Optional |

J5/J6 must also deactivate/reactivate the `User`, revoke refresh tokens, and block sign-in while suspended. Reason is required server-side; the UI only enforces `minLength=5` (`AdminPages.tsx:43`).

## K. Inferred/future endpoints (not required for MVP)

| ID | Method & path | Purpose | Auth | Notes | Source |
|---|---|---|---|---|---|
| K1 | `GET /api/v1/notifications/` | In-app alerts | Any | “Placement alerts”, “Application digest”, “Get notified first” | `StudentPlacements.tsx:37`, `ProductLayout.tsx` sidebar |
| K2 | `PATCH /api/v1/notifications/{id}/read/` | Mark read | Any | — | Inferred |
| K3 | `POST /api/v1/messages/` | Company ↔ applicant messaging | Company/Student | UI says messaging is not implemented | `CompanyPages.tsx:52` |
| K4 | `GET /api/v1/public/landing/` | Marketing content | Public | Landing is static today | `landing/data.ts:158-200` |
| K5 | `GET /api/v1/company/talent/?q=&discipline=&level=` | Talent search | Company | Footer mentions “Search Talent”, no UI | `landing/data.ts:105` |
| K6 | `POST /api/v1/admin/accounts/{id}/role/` | Role changes | Admin | No UI | Inferred |
