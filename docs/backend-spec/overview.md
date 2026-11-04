# Fixth Backend Specification — Overview

> **Implemented API contract:** see [`api-reference.md`](./api-reference.md) for the endpoints that currently exist and are ready for frontend consumption. The machine-readable schema is served at `/api/v1/schema/`.

## What the app does

Fixth is a Nigerian engineering-talent marketplace focused on **SIWES placements, industrial training, and internships**. Three audiences share one SPA:

- **Students** create a profile, upload a resume, discover verified placements, save roles, apply in one step, and track applications.
- **Companies** create/publish/close placement listings, review applicants, move them through application statuses, and view gated contact details.
- **Trust & Safety admins** verify students/companies, moderate listings, suspend/restore accounts, and review an audit log.

## Main user flows

1. Landing page → hero search → `/student/discover?q=…&styles=…` (`src/features/landing/components/HeroSearch.tsx:22-30`).
2. Student onboarding: email → 6-digit code → about → education → preferences → skills → review → complete (`src/features/onboarding/flow.ts:12-18`).
3. Organization onboarding: email → code → details → story → review → complete (`src/features/onboarding/flow.ts:8-11`).
4. Sign-in and password reset: `/auth/sign-in` account chooser with separate student and organization pages under `/auth/student/` and `/auth/organization/` (`src/features/auth/SignInPage.tsx`, `src/features/auth/SignInChooserPage.tsx`).
5. Student workspace: discover, saved, applications, profile/edit, resume (`src/routes/index.tsx:19-28`).
6. Company workspace: placements, new/edit, applicants, applicant review, company profile (`src/routes/index.tsx:30-39`).
7. Admin workspace: verification queue/review, listing moderation, accounts, audit (`src/routes/index.tsx:40-47`).
8. Canonical public placement share link: `/p/:slug` (`src/routes/index.tsx:29`; `src/features/product/components/ui.tsx:35`).

## Tech stack

| Area | Current choice | Evidence |
|---|---|---|
| Framework | React 19.2 + TypeScript 6 + Vite 8 | `package.json:13-28` |
| Routing | `react-router` 8, `createBrowserRouter` | `package.json:18`, `src/routes/index.tsx:13-49` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | `package.json:14,19`, `vite.config.ts:8-14` |
| Icons | `lucide-react` | `package.json:15` |
| State management | One React context (`ProductProvider`) + `sessionStorage` key `fixth-product-preview` | `src/features/product/store.tsx:5-49`, `src/components/layout/RootLayout.tsx:2-4` |
| HTTP client | Hand-written `fetch` wrapper; currently **unused** | `src/services/http.ts:21-42` |
| Data fetching/cache | None (no React Query/SWR/axios) | `package.json:13-19` |
| Mock data | Hardcoded arrays and objects | `src/features/product/data.ts:24-53`, `src/features/landing/data.ts:158-200` |
| Auth | None; no token storage, no guards | `src/features/auth/SignInPage.tsx:10-15`, `src/services/http.ts:21-42` |
| API base URL | `VITE_API_URL`, fallback `/api/v1` | `src/services/http.ts:7`, `src/config/env.ts:5-9`, `.env.example:2` |

## Architecture notes

- `RootLayout` wraps **every** route in `ProductProvider`, including onboarding and the landing page (`src/components/layout/RootLayout.tsx:2-4`). There is no separate server-state layer.
- Every product page reads/writes the in-memory store; persistence is best-effort `sessionStorage` (`src/features/product/store.tsx:10-16,28-32`).
- All workspace routes are publicly reachable by URL. No role guard exists (`src/routes/index.tsx:19-47`; `README.md:103`).
- `http.ts` always sends `Content-Type: application/json`, has no `Authorization` header, no refresh handling, no `credentials`, and throws `ApiError(statusText, status)` without parsing the response body (`src/services/http.ts:21-42`). It returns `undefined` for `204` (`:37-39`).
- There is no Vite dev proxy (`vite.config.ts:8-14`). `.env.example:2` and the client fallback both use the canonical `http://localhost:8000/api/v1` / `/api/v1` base.
- Frontend types are camelCase (`workStyle`, `placementId`, `firstName`, `studentId`, `graduation`); DRF will naturally emit snake_case. A thin service/mapping layer is needed either way.
- The store exposes exactly the mutations a backend will own: `updateProfile`, `toggleSaved`, `apply`, `savePlacement`, `candidateStatus`, `moderate`, `deleteProfile` (`src/features/product/store.tsx:17-47`). These are the best guide to required write endpoints.
- The only uploads are kept as `File` objects in memory or filenames in `sessionStorage`; no bytes reach a server (`README.md:72,103`).

## Key finding

There are **zero** calls to `request()` and **zero** real backend calls anywhere in `src/`. Every endpoint in `endpoints.md` is therefore **inferred** from UI operations, mock data, or comments. The `source` column in `endpoints.md` cites where the need originates.

## Recommended backend shape

- Django 5.2 LTS + DRF, PostgreSQL, Redis, Celery, SimpleJWT, S3-compatible private media.
- Suggested apps: `accounts`, `profiles`, `companies`, `placements`, `applications`, `verification`, `moderation`, `audit`, `notifications`, `common`.
- Set `AUTH_USER_MODEL` before the first migration.
- Suggested build order: auth/OTP → student/company profiles → placement reads → saved → applications → company listing CRUD/applicants → admin verification/moderation/audit → uploads/email → notifications.
