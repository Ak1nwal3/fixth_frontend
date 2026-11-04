# Fixth API Reference — Implemented Endpoints

> **Status:** This document describes the endpoints currently implemented in `backend/fixth_backend`. It is the contract the frontend should build against.
>
> `endpoints.md` remains the broader product/backend specification and includes endpoints that are **not implemented yet**. When the two disagree, use this document.
>
> **Last updated:** 2026-11-04
>
> **Interactive docs:** `/api/v1/docs/` · **OpenAPI schema:** `/api/v1/schema/` · **ReDoc:** `/api/v1/redoc/`
>
> Download the machine-readable schema for client generation:
>
> ```bash
> curl http://localhost:8000/api/v1/schema/ -o openapi.yaml
> ```

---

## 1. Quick start

### Base URL

```text
http://localhost:8000/api/v1
```

The frontend reads `VITE_API_URL`, falling back to `/api/v1`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

All paths below are relative to that base URL. Keep trailing slashes.

### Authentication

Most write endpoints require a JWT access token:

```http
Authorization: Bearer <access_token>
```

- Access token lifetime: **15 minutes**
- Refresh token lifetime: **7 days**
- Refreshing rotates the refresh token and blacklists the old one.
- Sign-out blacklists the refresh token.

If an access token expires, call the matching role refresh endpoint once, replace the stored token pair, and retry the request. If refresh returns `401`, clear the session and send the user to sign-in.

### Roles

| Role | Value | Sign-in namespace |
|---|---|---|
| Student | `student` | `/auth/student/...` |
| Organization | `company` | `/auth/organization/...` |
| Administrator | `admin` | `/auth/...` (generic routes are admin-only) |

Wrong-role sign-in returns a generic `401` and does not reveal whether the email exists for another role.

### Content types

- JSON endpoints: `Content-Type: application/json`
- Organization onboarding: **`multipart/form-data` only**
- Student onboarding completion: JSON or multipart
- Logo upload: part of the organization onboarding multipart request

### Error format

Most errors use one of these shapes:

```json
{ "detail": "Invalid email or password." }
```

```json
{ "email": ["Enter a valid institutional email ending in .edu.ng."] }
```

Password reset confirmation can also return field errors:

```json
{
  "detail": "Password does not meet requirements.",
  "errors": { "new_password": ["This password is too common."] }
}
```

Common status codes:

| Code | Meaning |
|---|---|
| `400` | Validation error, invalid/expired code or token |
| `401` | Missing/invalid access token, bad credentials, wrong-role refresh |
| `403` | Wrong role, unverified account, missing company profile |
| `404` | Not found, or not visible to the caller |
| `409` | Duplicate, illegal state/status transition, email already in use |
| `413` | Upload too large or logo dimensions too large |
| `415` | Wrong media type or unsupported logo format |
| `429` | Throttled |

### Throttling

| Scope | Used by | Rate |
|---|---|---|
| `onboarding_request` | OTP request endpoints | 5/hour |
| `onboarding_verify` | OTP verify endpoints | 20/hour |
| `onboarding_complete` | Student/organization completion | 10/hour |
| `auth` | Sign-in, refresh, sign-out, password reset | 10/min |

Handle `429` with a user-facing retry message and backoff.

### Pagination

Only placement lists are paginated:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/placements/?page=2",
  "previous": null,
  "results": []
}
```

Default page size is `20`; pass `?page_size=` up to `100`. Reference endpoints return plain arrays.

### Naming

The API uses DRF snake_case. The frontend types use camelCase. Map at the service boundary.

| Frontend | API |
|---|---|
| `workStyle` | `work_style` |
| `firstName` / `lastName` | `first_name` / `last_name` |
| `studentId` | `student_id` |
| `graduation` | `graduation_year` |
| `verification` | `verification_status` |
| `risk` | `risk_level` |
| `stipend` | `stipend` (formatted display string) |
| `reports` | `reports` |
| `match` | `match` |

Money is returned both as a display string and a decimal string:

```json
{
  "stipend": "₦150,000",
  "stipend_amount": "150000.00",
  "currency": "NGN"
}
```

---

## 2. Endpoint index

### Onboarding and OTP

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/otp/request/` | Public | Request an onboarding code for `student` or `organization` |
| `POST` | `/auth/otp/verify/` | Public | Verify a code and receive a verification token |
| `POST` | `/onboarding/students/request-otp/` | Public | Student-only OTP request alias |
| `POST` | `/onboarding/students/verify-otp/` | Public | Student-only OTP verification alias |
| `POST` | `/onboarding/students/complete/` | Public | Create student account and profile |
| `POST` | `/onboarding/organizations/complete/` | Public | Create organization account and company |

### Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/student/sign-in/` | Public | Student sign-in |
| `POST` | `/auth/organization/sign-in/` | Public | Organization sign-in |
| `POST` | `/auth/sign-in/` | Public | Administrator sign-in |
| `POST` | `/auth/student/refresh/` | Public | Rotate student tokens |
| `POST` | `/auth/organization/refresh/` | Public | Rotate organization tokens |
| `POST` | `/auth/refresh/` | Public | Rotate administrator tokens |
| `POST` | `/auth/student/sign-out/` | Public | Blacklist student refresh token |
| `POST` | `/auth/organization/sign-out/` | Public | Blacklist organization refresh token |
| `POST` | `/auth/sign-out/` | Public | Blacklist administrator refresh token |
| `POST` | `/auth/student/password-reset/` | Public | Request student reset link |
| `POST` | `/auth/organization/password-reset/` | Public | Request organization reset link |
| `POST` | `/auth/password-reset/` | Public | Request administrator reset link |
| `POST` | `/auth/student/password-reset/confirm/` | Public | Confirm student reset |
| `POST` | `/auth/organization/password-reset/confirm/` | Public | Confirm organization reset |
| `POST` | `/auth/password-reset/confirm/` | Public | Confirm administrator reset |
| `GET` | `/auth/student/me/` | Student | Current student account |
| `PATCH` | `/auth/student/me/` | Student | Update student name/password |
| `GET` | `/auth/organization/me/` | Organization | Current organization account |
| `PATCH` | `/auth/organization/me/` | Organization | Update organization name/password |
| `GET` | `/auth/me/` | Admin | Current administrator account |
| `PATCH` | `/auth/me/` | Admin | Update administrator name/password |

The generic `/auth/sign-in/`, `/auth/refresh/`, `/auth/sign-out/`, `/auth/password-reset/`, `/auth/password-reset/confirm/`, and `/auth/me/` routes are **administrator-only**.

### Reference data and student profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/skills/?search=` | Public | Skill typeahead |
| `GET` | `/disciplines/?search=` | Public | Discipline typeahead |
| `GET` | `/students/me/` | Student | Current student profile |
| `POST` | `/students/me/` | Student | Create profile if missing |
| `PATCH` | `/students/me/` | Student | Update current profile |

### Public placement discovery

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/placements/` | Optional | Discover active, open placements |
| `GET` | `/placements/{slug}/` | Optional | Placement detail by slug |
| `GET` | `/placements/by-id/{id}/` | Optional | Placement detail by UUID |

“Optional” means anonymous requests work. A student access token adds `match`, `is_saved`, `has_applied`, `eligibility`, and `can_apply`.

### Company placement management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/company/placements/` | Company | List own placements in every state |
| `POST` | `/company/placements/` | Company | Create a draft or publish immediately |
| `GET` | `/company/placements/{id}/` | Company | Own placement detail/preview |
| `PATCH` | `/company/placements/{id}/` | Company | Edit, save draft, close, or publish |
| `POST` | `/company/placements/{id}/publish/` | Company | Publish a draft or closed placement |

Company endpoints require an active organization account with a verified email. A company whose verification status is `Pending` can create/publish; listings from `Rejected` companies are hidden from public discovery.

### Company application management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/company/applications/` | Company | List applications across all own placements |
| `GET` | `/company/applications/{id}/` | Company | Review one application |
| `PATCH` | `/company/applications/{id}/` | Company | Change application status |
| `GET` | `/company/placements/{placement_id}/applicants/` | Company | List applicants for one placement |

Companies can read applications and move them through review statuses. They cannot create or delete student applications; those records are student-owned and preserved for history.

---

## 3. Shared response shapes

### `User`

```text
id, email, first_name, last_name, full_name, role, account_status,
email_verified_at, is_active, is_staff, date_joined, last_login
```

### `Me`

`User` plus:

```text
student_profile_id, company_id
```

### `StudentProfile`

```text
id, user_id, email, first_name, last_name, phone, location, institution,
discipline, level, graduation_year, student_id, start_date, duration,
work_styles[], portfolio, interests, skills[], photo, resume,
verification_status, risk_level, profile_strength, deleted_at,
created_at, updated_at
```

- `discipline` and `skills[]` are display names.
- `photo` and `resume` are `Document` objects or `null`.
- `email`, `verification_status`, `risk_level`, `profile_strength`, timestamps, `photo`, and `resume` are read-only.

### `Document`

```text
id, owner_id, kind, file, original_name, mime_type, size, is_private,
scan_status, created_at, url
```

`url` is the absolute file URL when available. Private documents should not be exposed directly by the frontend without an authenticated download flow.

### `Company`

```text
id, owner_id, name, slug, website, industry, description, country, city,
address, logo, registration_number, primary_contact_name,
primary_contact_title, verification_status, risk_level, created_at, updated_at
```

`logo` is a `Document` object or `null`. `industry` is one of `Technology`, `Engineering`, `Construction`, `Manufacturing`, `Energy`, `Other`.

### `Placement`

```text
id, slug, title, company, company_id, company_slug, company_logo_url,
company_verified, location, work_style, duration, discipline, level,
stipend, stipend_amount, currency, description, responsibilities,
requirements, status, reports, match, is_saved, has_applied,
published_at, created_at, updated_at
```

- `company` and `discipline` are display-name strings.
- `work_style`: `Hybrid`, `Remote`, or `On-site`.
- `status`: `Active`, `Draft`, `Closed`, `Expired`, or `Unpublished`.
- `match`: integer or `null`; only populated for a signed-in student with a discipline.
- `reports`: report count.

### `PlacementDetail`

`Placement` plus:

```json
{
  "eligibility": {
    "eligible": true,
    "reason": "You meet the eligibility requirements.",
    "required_level": 300,
    "required_discipline": "Computer Engineering"
  },
  "can_apply": false
}
```

`eligibility` checks exact discipline match and `student.level >= placement.level`. `can_apply` additionally requires an active/open placement, an uploaded resume, no existing application, and a non-deleted profile.

### `Application`

```text
id, placement, placement_id, student, student_id, resume, status,
applied_at, status_changed_at, decided_by_email, rejection_reason,
cover_note, events[], updated_at
```

- `placement` is the full `Placement` shape.
- `student` is a privacy-limited profile summary:
  `id, user_id, first_name, last_name, full_name, institution, discipline, level, location, skills[], photo_url, verification_status, risk_level`.
- `resume` is a `Document` object or `null`.
- `status`: `Submitted`, `Viewed`, `Shortlisted`, `Rejected`, or `Accepted`.
- `decided_by_email` is the company user who last changed the status.
- `cover_note` is currently read-only until the student apply endpoint exists.
- `events[]` contains `id, from_status, to_status, actor_email, reason, created_at`.

### `Paginated<Placement>`

```text
count, next, previous, results[]
```

`Paginated<Application>` uses the same `count, next, previous, results[]` shape.

---

## 4. Onboarding and OTP

### 4.1 Request an onboarding code

```http
POST /api/v1/auth/otp/request/
Content-Type: application/json
```

```json
{
  "email": "student@university.edu.ng",
  "track": "student"
}
```

`track` is `student` or `organization`. Student emails must end in `.edu.ng`; organization emails use a normal work email.

**202**

```json
{
  "detail": "If the address is eligible, a verification code has been sent.",
  "expires_in": 600,
  "resend_after": 60
}
```

The response is intentionally generic so it cannot be used to enumerate accounts. Existing accounts receive the same response.

In production, delivery is queued to a Celery worker and sent through Resend, so `202` means the request was accepted, not that the inbox has already received the message. Keep the resend button disabled for `resend_after` seconds and do not retry automatically.

Errors: `400` invalid email/track, `429`.

### 4.2 Verify an onboarding code

```http
POST /api/v1/auth/otp/verify/
Content-Type: application/json
```

```json
{
  "email": "student@university.edu.ng",
  "track": "student",
  "code": "123456"
}
```

**200**

```json
{
  "verification_token": "signed-token",
  "is_new_user": true
}
```

The verification token proves ownership of the email. It is signed, valid for 10 minutes, and single-use. For organization onboarding, send it as `verification_token` to the completion endpoint.

Errors: `400` wrong/expired code, `429`.

### 4.3 Student OTP aliases

These are student-specific helpers. They use the same code and throttling behavior but return simpler responses.

```http
POST /api/v1/onboarding/students/request-otp/
Content-Type: application/json

{ "email": "student@university.edu.ng" }
```

**202**

```json
{ "detail": "If the address is eligible, a verification code has been sent." }
```

```http
POST /api/v1/onboarding/students/verify-otp/
Content-Type: application/json

{ "email": "student@university.edu.ng", "code": "123456" }
```

**200**

```json
{ "detail": "Email verified. Complete your profile to continue." }
```

The code is not consumed by the verify call. It is consumed when student onboarding is completed.

### 4.4 Complete student onboarding

```http
POST /api/v1/onboarding/students/complete/
Content-Type: application/json
```

```json
{
  "email": "student@university.edu.ng",
  "code": "123456",
  "password": "StrongPass!234",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "phone": "08012345678",
  "location": "Lagos",
  "institution": "University of Lagos",
  "discipline": "Computer Engineering",
  "level": 300,
  "graduation_year": 2027,
  "student_id": "190404001",
  "start_date": "2026-06-01",
  "duration": "6 months",
  "work_styles": ["Hybrid", "Remote"],
  "skills": ["Python", "Django"],
  "portfolio": "https://example.com",
  "interests": "Backend engineering"
}
```

Required: `email`, `code`, `first_name`, `last_name`, `location`, `institution`, `discipline`, `level`.

`password` is optional. If omitted, the account is passwordless until the user completes a password reset. `discipline` and skill names are resolved to canonical records; unknown names are created.

**201**

```json
{
  "user": {},
  "student": {},
  "access": "access-token",
  "refresh": "refresh-token"
}
```

Errors: `400` invalid/expired code, `409` email already registered/onboarding conflict, `429`.

The code and account creation are atomic. If anything fails, the code is not consumed and no account is created.

### 4.5 Complete organization onboarding

```http
POST /api/v1/onboarding/organizations/complete/
Content-Type: multipart/form-data
```

| Field | Required | Notes |
|---|---|---|
| `verification_token` | Yes | From `/auth/otp/verify/` with `track=organization` |
| `organization_name` | Yes | Max 200 |
| `work_email` | Yes | Must match the verified token email |
| `industry` | Yes | Company industry enum |
| `country` | Yes | Max 100 |
| `city` | Yes | Max 100 |
| `website` | No | Scheme optional; normalized to `https://...` |
| `description` | No | Max 500 |
| `address` | No | Max 255 |
| `logo` | No | JPEG, PNG, or WebP |

Logo rules:

- Maximum 5 MB.
- Maximum 4096 × 4096 and 16 megapixels.
- Content is inspected with Pillow; extension/MIME are forced server-side.
- Too large/dimensions: `413`.
- Wrong/unsupported content: `415`.

This endpoint rejects JSON with `415`. Use `FormData`; do not manually set the multipart boundary.

**201**

```json
{
  "user": {},
  "company": {},
  "access": "access-token",
  "refresh": "refresh-token"
}
```

Errors: `400` invalid/expired token or email mismatch, `409` email already registered, `413`, `415`, `429`.

The verification token is single-use. Organization accounts are passwordless by default; use the organization password-reset flow to set a password before password-based sign-in.

---

## 5. Authentication

The request and response shapes below are identical across roles; only the path namespace changes.

### 5.1 Sign in

```http
POST /api/v1/auth/student/sign-in/
Content-Type: application/json
```

```json
{
  "email": "student@university.edu.ng",
  "password": "StrongPass!234"
}
```

**200**

```json
{
  "access": "access-token",
  "refresh": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "student@university.edu.ng",
    "role": "student",
    "account_status": "active",
    "email_verified_at": "2026-11-03T10:00:00Z",
    "is_active": true
  }
}
```

Behavior:

- Student sign-in requires a `.edu.ng` email.
- Organization and administrator sign-in accept standard emails.
- Wrong password, wrong role, suspended, or inactive account: generic `401`.
- Unverified email: `403`.
- Administrator sign-in accepts accounts where `role="admin"` or `is_superuser=true`.

### 5.2 Refresh tokens

```http
POST /api/v1/auth/student/refresh/
Content-Type: application/json

{ "refresh": "refresh-token" }
```

**200**

```json
{
  "access": "new-access-token",
  "refresh": "new-refresh-token"
}
```

The old refresh token is blacklisted. Store the new pair atomically. A wrong-role refresh token returns `401` and is not rotated.

### 5.3 Sign out

```http
POST /api/v1/auth/student/sign-out/
Content-Type: application/json

{ "refresh": "refresh-token" }
```

**204 No Content**

No `Authorization` header is required; the refresh token identifies the session. Invalid, expired, or wrong-role tokens return `401` and are not blacklisted.

### 5.4 Request a password reset

```http
POST /api/v1/auth/student/password-reset/
Content-Type: application/json

{ "email": "student@university.edu.ng" }
```

**202**

```json
{ "detail": "If an account exists, a password reset link has been sent." }
```

The response is always generic. Only an account matching the requested role receives email. Student reset requests require a `.edu.ng` email.

The backend currently generates links in this shape:

```text
http://localhost:5173/reset-password?uid=<uid>&token=<token>
```

The frontend does not yet have a `/reset-password` route; it must be added to consume these parameters.

### 5.5 Confirm a password reset

```http
POST /api/v1/auth/student/password-reset/confirm/
Content-Type: application/json

{
  "uid": "<uid>",
  "token": "<token>",
  "new_password": "NewStrongPass!234"
}
```

**204 No Content**

Errors: `400` invalid/expired token or password policy failure.

### 5.6 Current account

```http
GET /api/v1/auth/student/me/
Authorization: Bearer <access>
```

**200** `Me`

```http
PATCH /api/v1/auth/student/me/
Authorization: Bearer <access>
Content-Type: application/json
```

```json
{
  "first_name": "Grace",
  "last_name": "Hopper",
  "current_password": "OldPass!234",
  "new_password": "NewPass!234"
}
```

- `first_name`, `last_name`, `current_password`, and `new_password` are optional.
- Changing the password requires `current_password`.
- Email changes are rejected with `400` until a verified-new-email flow exists.
- An email already used by another account returns `409`.

Role-specific `/me/` routes:

| Role | Path |
|---|---|
| Student | `/auth/student/me/` |
| Organization | `/auth/organization/me/` |
| Administrator | `/auth/me/` |

Each route enforces the corresponding role and verified-email requirement.

---

## 6. Reference data and student profile

### 6.1 Skills and disciplines

```http
GET /api/v1/skills/?search=python
GET /api/v1/disciplines/?search=computer
```

Public, no auth. Returns a plain array (max 50), not paginated.

```json
[
  { "id": "uuid", "name": "Python", "slug": "python" }
]
```

If `search` is omitted, the first 50 canonical rows are returned ordered by name. Writing a profile or placement with an unknown discipline/skill name creates the canonical row.

### 6.2 Get the current student profile

```http
GET /api/v1/students/me/
Authorization: Bearer <student-access>
```

**200** `StudentProfile`

`401` unauthenticated, `403` wrong role/unverified student, `404` profile not created yet.

### 6.3 Create a student profile

```http
POST /api/v1/students/me/
Authorization: Bearer <student-access>
Content-Type: application/json
```

```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "phone": "08012345678",
  "location": "Lagos",
  "institution": "University of Lagos",
  "discipline": "Computer Engineering",
  "level": 300,
  "graduation_year": 2027,
  "student_id": "190404001",
  "start_date": "2026-06-01",
  "duration": "6 months",
  "work_styles": ["Hybrid", "Remote"],
  "skills": ["Python", "Django"],
  "portfolio": "https://example.com",
  "interests": "Backend engineering"
}
```

Required: `first_name`, `last_name`, `location`, `institution`, `discipline`, `level`.

**201** `StudentProfile`

`409` if a profile already exists for the account.

### 6.4 Update the student profile

```http
PATCH /api/v1/students/me/
Authorization: Bearer <student-access>
Content-Type: application/json
```

Partial `StudentProfile` payload. `skills` replaces the full skill set when provided.

`email` is read-only here; email changes go through `/auth/student/me/` and are currently rejected pending a re-verification flow.

`photo` and `resume` are read-only. There is no document upload endpoint yet.

---

## 7. Public placement discovery

### 7.1 Discover active placements

```http
GET /api/v1/placements/?q=backend&discipline=Computer%20Engineering&work_style=Remote,Hybrid&sort=match&page=1&page_size=20
```

Public. A student access token is optional.

Query parameters:

| Parameter | Notes |
|---|---|
| `q` | Search title, company name, or discipline |
| `discipline` | Discipline name or slug |
| `location` | Partial location match |
| `duration` | Exact duration, case-insensitive |
| `work_style` | Repeatable or comma-separated: `Remote`, `Hybrid`, `On-site` |
| `styles` | Alias for `work_style` |
| `saved` | `true` returns only the signed-in student’s saved roles |
| `sort` | `newest` (default), `title`, or `match` |
| `page` / `page_size` | Pagination; default 20, max 100 |

`sort=match` is meaningful only for a signed-in student with a discipline; otherwise it falls back to newest. `saved=true` requires a student token: anonymous returns `401`, a non-student account returns `403`. An unsupported `sort` returns `400`.

**200**

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "slug": "backend-engineering-intern",
      "title": "Backend Engineering Intern",
      "company": "Nova Labs",
      "company_id": "uuid",
      "company_slug": "nova-labs",
      "company_logo_url": null,
      "company_verified": false,
      "location": "Lagos",
      "work_style": "Hybrid",
      "duration": "6 months",
      "discipline": "Computer Engineering",
      "level": 300,
      "stipend": "₦150,000",
      "stipend_amount": "150000.00",
      "currency": "NGN",
      "description": "Build and maintain the Fixth API.",
      "responsibilities": "Ship features and review code.",
      "requirements": "Python and Django.",
      "status": "Active",
      "reports": 0,
      "match": 100,
      "is_saved": false,
      "has_applied": false,
      "published_at": "2026-11-03T10:00:00Z",
      "created_at": "2026-11-03T09:59:00Z",
      "updated_at": "2026-11-03T10:00:00Z"
    }
  ]
}
```

Only `Active` listings with no past `expires_at`, from active companies that are not `Rejected`, are returned.

### 7.2 Placement detail by slug

```http
GET /api/v1/placements/backend-engineering-intern/
```

**200** `PlacementDetail`. A draft, closed, expired, unpublished, or rejected-company listing returns `404`.

### 7.3 Placement detail by UUID

```http
GET /api/v1/placements/by-id/<uuid>/
```

**200** `PlacementDetail`, or `404`.

---

## 8. Company placement management

All endpoints in this section require:

```http
Authorization: Bearer <organization-access>
```

The account must be an active company account with a verified email. If the account has no company profile, the API returns `403`. Companies can only access their own placements; another company’s placement returns `404`.

### 8.1 List own placements

```http
GET /api/v1/company/placements/?status=Draft&q=backend&sort=newest&page=1&page_size=20
```

Returns `Paginated<Placement>` in every state, including drafts and closed listings.

| Parameter | Notes |
|---|---|
| `status` | `Active`, `Draft`, `Closed`, `Expired`, `Unpublished`, or `All`; case-insensitive |
| `q` | Search title or discipline |
| `sort` | `newest` (default), `oldest`, or `title` |
| `page` / `page_size` | Pagination |

`Active` excludes listings whose `expires_at` has passed. `Expired` includes explicit expired records and active listings past their expiry time. An invalid status returns `400`.

### 8.2 Create a placement

```http
POST /api/v1/company/placements/
Authorization: Bearer <organization-access>
Content-Type: application/json
```

```json
{
  "title": "Backend Engineering Intern",
  "location": "Lagos",
  "work_style": "Hybrid",
  "duration": "6 months",
  "discipline": "Computer Engineering",
  "level": 300,
  "stipend_amount": "150000.00",
  "currency": "NGN",
  "description": "Build and maintain the Fixth API.",
  "responsibilities": "Ship features and review code.",
  "requirements": "Python, Django, and REST APIs.",
  "status": "Draft",
  "expires_at": "2027-03-01T00:00:00Z"
}
```

Required at create time: `title`, `location`, `work_style`, `duration`, `discipline`, `level`.

Optional: `stipend_amount`, `currency` (default `NGN`), `description`, `responsibilities`, `requirements`, `status`, `expires_at`.

`status` at creation may be `Draft` or `Active` only and defaults to `Draft`.

- `Draft`: save now, publish later. Content fields and stipend may be omitted.
- `Active`: publish immediately. All publish requirements below must pass.

**201** `Placement`

Server-owned fields are ignored if sent, including `id`, `slug`, `company`, `company_id`, `created_by`, `reports`, `published_at`, `closed_at`, `created_at`, and `updated_at`.

`discipline` is a display name. An unknown discipline is created as a canonical row.

Errors: `400`, `401`, `403`.

### 8.3 Preview / get own placement

```http
GET /api/v1/company/placements/{id}/
Authorization: Bearer <organization-access>
```

**200** `Placement` in any state. This is the endpoint to use for draft preview.

`404` if the placement does not belong to the caller’s company.

### 8.4 Update or publish a placement

```http
PATCH /api/v1/company/placements/{id}/
Authorization: Bearer <organization-access>
Content-Type: application/json
```

Send any writable placement fields, optionally with `status`:

```json
{
  "title": "Senior Backend Engineering Intern",
  "description": "Updated description.",
  "stipend_amount": "200000.00",
  "status": "Active"
}
```

Allowed status transitions:

```text
Draft  -> Draft or Active
Active -> Active or Closed
Closed -> Closed or Active
```

`Expired` and `Unpublished` are administrator-owned states and cannot be set through this endpoint.

Publishing (`status="Active"`) requires complete content:

```text
title, location, work_style, duration, discipline, level,
description, responsibilities, requirements, stipend_amount
```

`stipend_amount` must be positive. Missing content returns `400` and the placement remains in its current state. An illegal transition returns `409`.

**200** `Placement`

### 8.5 Publish a placement

```http
POST /api/v1/company/placements/{id}/publish/
Authorization: Bearer <organization-access>
```

No request body.

**200** `Placement` with `status="Active"`.

Errors:

- `400` missing required publishing content.
- `409` the placement is already active, expired, or unpublished. Only draft/closed placements can use this action.
- `404` not owned by the caller.

---

## 9. Company application management

All endpoints in this section require an active, verified company account:

```http
Authorization: Bearer <organization-access>
```

The company only sees applications attached to its own placements. Another company’s application returns `404`.

### 9.1 List applications across the company

```http
GET /api/v1/company/applications/?status=Shortlisted&q=ada&discipline=computer-engineering&sort=newest&page=1&page_size=20
```

| Parameter | Notes |
|---|---|
| `placement` | Placement UUID |
| `status` | `Submitted`, `Viewed`, `Shortlisted`, `Rejected`, `Accepted`, or `All`; case-insensitive |
| `q` | Applicant first/last name, institution, skill, or placement title |
| `discipline` | Applicant discipline name or slug |
| `sort` | `newest` (default), `oldest`, or `name` |
| `page` / `page_size` | Pagination; default 20, max 100 |

**200** `Paginated<Application>`

Invalid `status`, `placement`, or `sort` returns `400`.

### 9.2 List applicants for one placement

```http
GET /api/v1/company/placements/{placement_id}/applicants/?status=Viewed
```

Returns the same `Paginated<Application>` shape, scoped to one of the company’s placements. Supports `status`, `q`, `discipline`, `sort`, and pagination. A placement owned by another company returns `404`.

### 9.3 Review an application

```http
GET /api/v1/company/applications/{id}/
```

**200** `Application`

The response includes:

- The full placement.
- The privacy-limited student profile.
- Resume metadata, when a resume was attached.
- The student’s cover note.
- The status timeline (`events`).

Errors: `401`, `403`, `404`.

### 9.4 Change application status

```http
PATCH /api/v1/company/applications/{id}/
Authorization: Bearer <organization-access>
Content-Type: application/json
```

```json
{
  "status": "Shortlisted",
  "reason": "Strong portfolio and relevant Django experience."
}
```

Allowed target statuses: `Viewed`, `Shortlisted`, `Accepted`, and `Rejected`.

- `Submitted` is create-only and cannot be set through this endpoint.
- Setting the status the application already has returns `409`.
- An invalid status choice returns `400`.
- Each successful change appends an `ApplicationEvent`, sets `status_changed_at`, and records `decided_by`.
- When moving to `Rejected`, `reason` is stored as `rejection_reason`; for other statuses it is recorded on the event.

**200** `Application` with the updated status and timeline.

Errors: `400`, `401`, `403`, `404`, `409`.

### 9.5 Create and delete scope

Companies cannot create or delete applications:

- `POST /api/v1/company/applications/` returns `405`.
- `DELETE /api/v1/company/applications/{id}/` returns `405`.

Applications are student-owned records and are kept for audit/history. The company-side API intentionally supports list, retrieve, and status update only.

---

## 10. Frontend integration checklist

### 10.1 Base URL and CORS

Point the frontend at:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

The backend currently has **no CORS configuration**. Calling `localhost:8000` from `localhost:5173` will be blocked by the browser until you either:

- add `django-cors-headers` and allow the frontend origin, or
- add a Vite dev proxy and use a relative `/api/v1` base URL.

### 10.2 Token handling

The current `src/services/http.ts` does not attach an `Authorization` header and does not parse error bodies. Before wiring screens:

1. Store `access` and `refresh` in a single auth session.
2. Attach `Authorization: Bearer <access>` for authenticated requests.
3. On `401`, attempt one role-specific refresh.
4. Replace both tokens with the rotated pair.
5. On refresh failure, clear the session and redirect to the role’s sign-in page.

Do not send refresh tokens in URLs or logs.

### 10.3 Multipart uploads

`http.ts` always sets `Content-Type: application/json`. For organization onboarding with a logo, use `FormData` and let the browser set the multipart boundary. Do not manually set `Content-Type` for multipart requests.

### 10.4 Password reset route

The backend emails links to:

```text
/reset-password?uid=<uid>&token=<token>
```

The frontend does not have this route yet. Add a page that reads `uid` and `token`, collects `new_password`, and calls the matching role’s:

```text
POST /api/v1/auth/student/password-reset/confirm/
POST /api/v1/auth/organization/password-reset/confirm/
POST /api/v1/auth/password-reset/confirm/
```

### 10.5 Not implemented yet

The following product endpoints are **not available** despite appearing in `endpoints.md`:

- Company profile `GET/PATCH /companies/me/`
- Public company summary `/companies/{slug}/`
- Saved placements `POST/DELETE /placements/{id}/save/` and `/students/me/saved-placements/`
- Placement facets `/placements/facets/`
- Student-side applications (`POST /applications/`, student application list/detail/withdraw)
- Gated applicant contact details (`GET /company/applications/{id}/contact/`)
- Admin verification, moderation, accounts, and audit endpoints
- Document/photo/resume upload endpoints
- Listing report endpoint
- Dedicated placement close/delete actions (close via `PATCH status="Closed"` instead)
- Company summary metrics and applicant counts on the company placement list

`is_saved` and `has_applied` are returned for compatibility, but there are currently no save/apply endpoints to change them.

### 10.6 Demo-only frontend state

The current frontend still reads/writes `sessionStorage` via `ProductProvider`. Sign-in, onboarding, profile, and placement screens are mock flows. Wire the screens to this API only after adding a real auth/session layer; otherwise the UI will continue to show demo data even when the backend has live records.

---

## 11. Quick examples

### Sign in and store tokens

```bash
curl -X POST http://localhost:8000/api/v1/auth/student/sign-in/ \
  -H "Content-Type: application/json" \
  -d '{"email":"student@university.edu.ng","password":"StrongPass!234"}'
```

### Request an organization onboarding code

```bash
curl -X POST http://localhost:8000/api/v1/auth/otp/request/ \
  -H "Content-Type: application/json" \
  -d '{"email":"talent@novalabs.example","track":"organization"}'
```

### Create a draft placement

```bash
curl -X POST http://localhost:8000/api/v1/company/placements/ \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Backend Engineering Intern",
    "location":"Lagos",
    "work_style":"Hybrid",
    "duration":"6 months",
    "discipline":"Computer Engineering",
    "level":300,
    "status":"Draft"
  }'
```

### Publish a draft

```bash
curl -X POST http://localhost:8000/api/v1/company/placements/$PLACEMENT_ID/publish/ \
  -H "Authorization: Bearer $ACCESS"
```

### Update an application status

```bash
curl -X PATCH http://localhost:8000/api/v1/company/applications/$APPLICATION_ID/ \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"status":"Shortlisted","reason":"Strong portfolio."}'
```

### List applicants for a placement

```bash
curl "http://localhost:8000/api/v1/company/placements/$PLACEMENT_ID/applicants/?status=Viewed&page=1" \
  -H "Authorization: Bearer $ACCESS"
```

### Discover placements

```bash
curl "http://localhost:8000/api/v1/placements/?q=backend&sort=newest&page=1"
```
