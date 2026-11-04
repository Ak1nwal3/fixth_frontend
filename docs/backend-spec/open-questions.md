# Fixth Backend Specification — Open Questions

These are the things the code cannot decide. Each has a recommended default.

1. **No real API contract exists.** There are zero `request()` calls; every endpoint is inferred. Confirm the endpoint list before implementation. *Assumption:* the spec in `endpoints.md` is the intended contract.

2. **Base path/port conflict (resolved).** `.env.example:2`, `http.ts:7`, and `env.ts:6` use the canonical `http://localhost:8000/api/v1` / `/api/v1` base; legacy `/api` routes are removed.

3. **How are passwords created?** Onboarding collects no password (`flow.ts:8-18`), but sign-in requires one (`SignInPage.tsx:13`). Is there a missing password step, an email “set password” link, or passwordless magic-link auth? Also, where do companies sign in? The sign-in page says “Student account” only.

4. **Auth transport.** JWT Bearer vs httpOnly session cookies? The current client sends neither an `Authorization` header nor `credentials`. *Assumption:* Bearer JWT for MVP.

5. **OTP policy/provider.** What email provider, TTL, resend cooldown, max attempts, and domain restrictions? Is a student email required to be `.edu.ng`, and a company email required to match the company website domain? Evidence labels imply domain checks (`AdminPages.tsx:29`), but nothing enforces it.

6. **Role model.** Can one user be both student and company? Can a company have multiple staff members? How is the first admin created? *Assumption:* one role per user; company owner + optional members; admin via `createsuperuser`.

7. **Company membership.** Is `Company.owner` a single user or a team? The UI shows one contact (`Bola Okafor`) and one company account. *Assumption:* single owner for MVP, M2M members later.

8. **Verification policy.** Who sets `risk_level` (Low/Medium/Review) — an automated rules engine, an external provider, or the admin? Is company verification required before publishing a placement? The UI shows a “Verified company” badge unconditionally (`StudentPlacements.tsx:11,52`).

9. **Match score.** The `match` values (70–92) are hardcoded per placement (`data.ts:24-33`) and never recomputed. What is the formula? Is it per-student? *Assumption:* discipline match + level + skill overlap; compute on read, never store a single global value.

10. **Listing reports.** `reports` is a number on `Placement`, and admin filters `reports > 0` (`AdminPages.tsx:51`), but there is no reporting UI. Can students report a listing? What reasons? Is `reports` a counter or derived from reports? *Assumption:* add `PlacementReport` and expose `reports` as the open-report count.

11. **Placement lifecycle.** `Expired` is seeded but never set; there is no expiry input in the company editor. Is expiry automatic? Can a company reopen a `Closed`/`Expired` listing? Can an admin restore a company-closed listing? *Assumption:* `expires_at` + nightly job; company may reopen `Closed`/`Expired`; `Unpublished` is admin-only.

12. **Eligibility rules.** The UI requires exact case-insensitive discipline equality AND student level >= placement level (`StudentPlacements.tsx:49`). *Resolved for terms:* discipline is a canonical FK created automatically from normalized user input, with automatic aliases for conservative variants; no seed list or admin merge step. *Still open:* how “Graduate” maps to a numeric level (`flow.ts:15`). *Assumption:* Graduate → 600 or an `is_graduate` flag.

13. **Multi-valued profile preferences.** Profile `workStyle` is `"Hybrid · Remote"` and `duration` is `"3–6 months"` (`data.ts:45`), while placements use single `"Hybrid"` / `"6 months"`. Should the API model arrays/ranges? *Assumption:* `work_styles[]` and a duration choice/range; placements remain single-value.

14. **Skills/interests format.** The profile stores skills as a `" · "` string (`data.ts:46`), onboarding stores comma-separated (`OnboardingPage.tsx:36,49`), and the skill picker is hardcoded (`:83`). Should skills be a normalized M2M with a server-side catalog? *Assumption:* yes.

15. **Stipend.** The UI displays `"₦180,000"` (`data.ts:19`). Is it a number + currency, or free text? Is it monthly? *Assumption:* `Decimal + NGN + “monthly”`, with a formatted display field.

16. **Application status semantics.** Is status per application or per candidate? The UI stores it on a global `Candidate` (`data.ts:7-10`) but also updates an application for `c-1`/`pl-6` (`store.tsx:39`). Which transitions are legal? Does opening an applicant auto-mark `Viewed`, or only the button (`CompanyPages.tsx:52`)? *Assumption:* status lives on `Application`; explicit transitions; auto-view optional.

17. **Resume versioning.** The UI requires a live `resumeFile` object to apply (`StudentPlacements.tsx:51`), which is lost on refresh; only the filename persists (`README.md:103`). Should applications snapshot the resume version? Can a student have multiple resumes? *Assumption:* one active resume, new Document per replacement, application stores the document used.

18. **Resume visibility.** Can a company download a resume before shortlisting, or only after? Contact details are gated to Shortlisted/Accepted (`CompanyPages.tsx:52`), but resume viewing is not obviously gated.

19. **Company applicants route.** `/company/applicants` has no placement id and the UI hardcodes `pl-6` (`CompanyPages.tsx:31,37`). Should it show all applications across the company, or redirect to a placement selection? *Assumption:* all applications across the company.

20. **Admin verification queue source.** The queue is built from `state.candidates` (applicants), not all registered students (`AdminPages.tsx:13`). Should every student/company appear once registered, or only those with submitted evidence? *Assumption:* every `VerificationRequest`, regardless of application activity.

21. **Account deletion.** `deleteProfile` clears profile, saved, applications, and session storage (`store.tsx:47`). Should the backend hard-delete, soft-delete, or anonymize? What happens to applications/audit records and legal retention? *Assumption:* soft-delete user + anonymize profile, retain audit and application history with a deleted-user marker.

22. **Public vs authenticated discovery.** `/student/discover` and `/p/:slug` are publicly reachable today (`routes/index.tsx:19-29`; `README.md:103`). Can anonymous users browse and view placements? Is `match` hidden for anonymous users? *Assumption:* public browse; auth required to save/apply.

23. **Pagination and counts.** The UI expects arrays and computes metrics from full local arrays (`StudentPlacements.tsx:35,59`). Should the API paginate, and should metrics come from summary endpoints? *Assumption:* paginate + summary endpoints.

24. **Error contract.** `http.ts` ignores the response body and uses `statusText` (`http.ts:33-35`). What shape should errors use? *Assumption:* `{detail, code, errors}` and update the client.

25. **CORS/dev proxy.** There is no Vite proxy (`vite.config.ts:8-14`). Will the frontend call `:8000` directly (CORS) or use a proxy? *Assumption:* direct absolute URL + CORS in dev.

26. **File preview/download.** `FilePreview` uses a local object URL and explicitly says no document is attached (`ui.tsx:59-69`). Should the API return signed URLs, a streamed download endpoint, or both? *Assumption:* authenticated `GET /documents/{id}/download/` returning a short-lived redirect.

27. **Notifications.** “Placement alerts”, “Application digest”, and “Get notified first” are static copy (`StudentPlacements.tsx:37`, `ProductLayout.tsx`). Are email/in-app notifications in scope? Real-time or polling? *Assumption:* out of MVP; polling later.

28. **Messaging.** The applicant contact modal says messaging requires the backend (`CompanyPages.tsx:52`). Is messaging in scope? *Assumption:* not in MVP.

29. **Audit retention/immutability.** How long are audit entries retained? Should they be exportable? Should verification evidence downloads be audited? *Assumption:* append-only, retained indefinitely, admin-only.

30. **Seed/demo accounts.** Should the backend seed the exact sample records in `data.ts:24-53`? What demo credentials should exist? *Assumption:* yes, fixtures with known demo passwords in dev only.

31. **Admin security.** Is 2FA required for Trust & Safety? No UI exists. *Assumption:* recommended for production, not MVP.

32. **Deployment/storage.** PostgreSQL + Redis + S3/R2? Or SQLite/local media for a demo? *Assumption:* Postgres/Redis/S3 in production, SQLite/local media in dev.

33. **Date semantics.** Application dates are a mix of date-only (`"2026-06-10"`) and ISO datetimes (`new Date().toISOString()`) (`data.ts:49-52`, `store.tsx:37`). Should `applied_at` be a datetime? *Assumption:* datetime, ISO 8601.

34. **Data shared with companies.** Which profile fields are visible on an application? Email/phone are gated, but institution, discipline, level, location, skills, student ID, and resume are shown (`CompanyPages.tsx:43-52`). Confirm the privacy matrix.

35. **Rate-limit thresholds.** No values exist in code. *Assumption:* OTP 5/hour/email, verify 10/hour, sign-in 10/min, reset 3/hour, anon 60/min, user 120/min.
