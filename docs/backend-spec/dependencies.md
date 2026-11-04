# Fixth Backend Specification — Cross-Cutting Requirements & Dependencies

## Authentication

- **Recommended:** JWT Bearer with `djangorestframework-simplejwt`.
  - Access token 30 minutes, refresh token 7 days, rotation + blacklist.
  - `rest_framework_simplejwt.token_blacklist` app for logout/revocation.
- The current `http.ts` has no `Authorization` header, no refresh retry, and no `credentials` (`src/services/http.ts:21-42`). The frontend must add:
  - token storage (memory + secure persistence),
  - `Authorization: Bearer <access>`,
  - automatic refresh on `401` once, then sign-out.
- If you choose httpOnly cookies instead: `credentials: "include"`, `CORS_ALLOW_CREDENTIALS=True`, CSRF trusted origins, and CSRF tokens. That is more secure but requires more frontend changes. **Recommend Bearer for MVP, httpOnly cookies for hardening.**
- Admin site can use Django session auth separately; do not mix it into the API auth chain unless needed.

## Roles and permissions

- `student`, `company`, `admin`.
- Object-level permissions:
  - company can only touch its own `Placement`s and `Application`s;
  - student can only read/write own profile, saved roles, applications;
  - admin can read moderation/verification/audit.
- Add `IsActiveAccount` permission so suspended users get `403` even with a valid token.
- Enforce the shortlisted/accepted gate for contact details server-side (`CompanyPages.tsx:52`).
- Enforce “reason required” for verification/moderation server-side (min 5 chars).
- Enforce company ownership when publishing/editing a placement; do not trust the route id.

## Pagination

- `PageNumberPagination`, default 20, max 100.
- Response: `{count, next, previous, results}`.
- The current UI expects arrays and computes lengths client-side (`StudentPlacements.tsx:35,59`). Update the service layer to read `.results`; for dashboard metrics use dedicated summary endpoints rather than counting a page.

## Filtering, search, sorting

| Endpoint | Filters |
|---|---|
| `GET /placements/` | `q`, `discipline`, `location`, `duration`, `work_style`, `saved`, `sort=match/title` |
| `GET /applications/` | `status`, `placement` |
| `GET /company/placements/` | `status`, `q` |
| `GET /company/.../applicants/` | `q` (name/skills), `status`, `discipline` |
| `GET /admin/verification-requests/` | `type`, `status`, `q`, `risk` |
| `GET /admin/placements/` | `q`, `status` (`all`, `active`, `flagged`, `unpublished`, `closed`, `expired`) |
| `GET /admin/accounts/` | `q`, `type`, `status` |
| `GET /admin/audit-logs/` | `action`, `subject_type`, `subject_id`, `date_from`, `date_to` |

Sorting: `sort=match` (computed descending) and `sort=title`; elsewhere `ordering` with allow-listed fields only.

## File uploads

- Endpoints: student photo, student resume, student verification evidence, company logo.
- Limits:
  - resume: PDF/DOC/DOCX, ≤5 MB (`StudentProfile.tsx:51-57`);
  - photo: PNG/JPEG/WebP, ≤2 MB (`StudentProfile.tsx:41`);
  - evidence: PDF/JPG/JPEG/PNG, ≤5 MB (`OnboardingPage.tsx:68-74`);
  - logo: image, ≤5 MB.
- Sniff MIME (`filetype`) and validate extension/size; never trust `Content-Type`.
- Store resumes/evidence privately. Use an authenticated download view that returns a short-lived signed URL or streams the file (`GET /documents/{id}/download/`).
- Do not expose `MEDIA_URL` for private documents. Public photos/logos can be public or signed.
- The frontend wrapper currently always sets `Content-Type: application/json`; multipart calls must omit it or use a dedicated upload helper. Note that `...init` after the headers object replaces the whole headers object if `init.headers` is supplied (`src/services/http.ts:25-31`), so callers can override, but this is fragile.

## Email / OTP

- Dev: `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`.
- Prod: SMTP/SES/SendGrid (optionally `django-anymail`).
- OTP rules: 6 digits, 10-minute TTL, max 5 attempts, 60-second resend cooldown, hashed code, one active code per email/purpose.
- Password reset: always return `202` to avoid account enumeration; reset links point at `FRONTEND_URL`.
- Domain checks are implied by evidence labels (“Institutional email”, “Company email domain”, `AdminPages.tsx:29`) but no validation exists in code. Optional DNS/MX or allow-list check.

## Real-time / WebSockets

- No WebSocket, SSE, or polling exists in `src/`.
- Notifications are only marketing copy (`StudentPlacements.tsx:37`, `ProductLayout.tsx`).
- **Recommendation:** ship without Channels; add `GET /notifications/` polling if needed. Add Channels only if the product requires live application-status updates or chat.

## Background jobs

- Celery + Redis:
  - send OTP/password-reset emails;
  - clean expired OTPs;
  - expire placements (`Active` → `Expired` when `expires_at` passes);
  - send application-status notifications;
  - optionally scan uploads;
  - compute/store match scores if you choose to cache them.
- `django-celery-beat` for scheduled expiry/cleanup.
- MVP fallback without Redis: send email synchronously and run expiry via a management command/cron.

## Third-party integrations

- Transactional email provider (required).
- S3-compatible object storage (strongly recommended for resumes; Cloudflare R2/S3).
- Optional domain-verification service for institutional/company email evidence.
- No payments, OAuth/social login, maps, SMS, or push notifications are present.

## CORS and dev proxy

- `django-cors-headers` with:
  - `http://localhost:5173` and `http://127.0.0.1:5173` (Vite default; no proxy currently, `vite.config.ts:8-14`);
  - the production frontend origin.
- Allow `Authorization`, `Content-Type`; methods `GET, POST, PATCH, PUT, DELETE, OPTIONS`.
- `CORS_ALLOW_CREDENTIALS=False` for Bearer JWT; `True` only for cookie auth.
- `VITE_API_URL` and the client fallback both use the canonical `/api/v1` base. Set the absolute URL in production or add a Vite proxy.

## Environment variables

Frontend:

- `VITE_API_URL` — the only declared variable (`src/vite-env.d.ts:4`, `.env.example:2`). Recommended: `http://localhost:8000/api/v1`.
- Optional future: `VITE_WS_URL`, `VITE_ENVIRONMENT`.

Backend:

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | signing/security |
| `DJANGO_DEBUG` | dev/prod |
| `DJANGO_ALLOWED_HOSTS` | host validation |
| `DATABASE_URL` | PostgreSQL DSN |
| `CORS_ALLOWED_ORIGINS` | Vite/prod origins |
| `CSRF_TRUSTED_ORIGINS` | only needed for session/cookie auth |
| `FRONTEND_URL` | reset links, canonical `/p/{slug}` links |
| `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS` | token lifetimes |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` | OTP/reset delivery |
| `OTP_TTL_MINUTES`, `OTP_MAX_ATTEMPTS` | OTP policy |
| `MAX_RESUME_MB`, `MAX_PHOTO_MB` | upload limits |
| `MEDIA_ROOT`, `MEDIA_URL` | local media |
| `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3/R2 media |
| `REDIS_URL`, `CELERY_BROKER_URL` | cache/throttle/queue |
| `TIME_ZONE=Africa/Lagos`, `CURRENCY=NGN` | locale |
| `SENTRY_DSN` | optional monitoring |

## Error contract

- Use DRF’s default field errors plus a top-level `detail`.
- The current client throws `ApiError(response.statusText, status)` and ignores the body (`src/services/http.ts:33-35`). Update it to parse `{detail, code, errors}` so the UI can show meaningful messages.
- Return `409` for duplicate applications/saves and illegal state transitions; `410` for closed/expired placements/OTP; `429` with `Retry-After`.

## Security / privacy

- Resumes and student IDs are PII: private storage, object-level authorization, short-lived URLs, audit downloads if required.
- Do not let companies see contact details before shortlisting (`CompanyPages.tsx:52`).
- Never expose student email/phone on public placement endpoints.
- Rate-limit OTP, sign-in, and password reset. Consider `django-axes` for lockout.
- Use Argon2 password hashing.
- Admin actions require a reason and produce an immutable audit entry.
- Account deletion must define whether applications are anonymized or deleted; see open question Q21.
- Use HTTPS; secure cookies if cookie auth is chosen.
- Admin 2FA is not in the UI but recommended for production.

## Timezone / locale

- `USE_TZ=True`, `TIME_ZONE="Africa/Lagos"`, `LANGUAGE_CODE="en-gb"`, currency `NGN`.
- Serialize ISO 8601 UTC; the frontend formats with `en-GB` (`data.ts:55`).

## API documentation

- `drf-spectacular`: `/api/v1/schema/`, `/api/v1/docs/`, `/api/v1/redoc/`.
- Document multipart endpoints and enum choices.

---

# Dependencies

## Core

| Package | Reason |
|---|---|
| `Django>=5.2,<6.0` | LTS web framework, ORM, migrations, admin. |
| `djangorestframework>=3.16,<4` | Serializers, viewsets, permissions, pagination. |
| `djangorestframework-simplejwt>=5.5,<6` | JWT access/refresh for the SPA. |
| `django-cors-headers>=4.7,<5` | Allow the Vite origin to call the API. |
| `django-filter>=24.3` | Placement/application/admin list filters. |
| `drf-spectacular>=0.28,<1` | OpenAPI schema and docs. |
| `django-environ>=0.12,<1` | 12-factor environment configuration. |
| `psycopg[binary]>=3.2,<4` | PostgreSQL driver. |
| `Pillow>=11.0` | Validate profile photos and company logos. |
| `gunicorn>=23.0,<24` | Production WSGI server (Linux/Docker). |
| `whitenoise>=6.8,<7` | Serve static/admin assets in production. |
| `argon2-cffi>=23.1` | Strong password hashing. |

## Required by features found

| Package | Reason |
|---|---|
| `celery[redis]>=5.4,<6` | Async OTP/reset email, expiry, notifications. |
| `redis>=5.2` | Celery broker, cache, throttle storage. |
| `django-celery-beat>=2.7,<3` | Scheduled placement expiry/OTP cleanup. |
| `django-storages[s3]>=1.14,<2` | Private S3/R2 storage for resumes/evidence. |
| `boto3>=1.35,<2` | S3 client used by `django-storages`. |
| `filetype>=1.2,<2` | Pure-Python MIME sniffing for uploads. |
| `channels[daphne]>=4.2,<5` | **Only if** real-time notifications/chat are added. |
| `channels-redis>=4.2,<5` | **Only if** Channels is used. |
| `django-axes>=7` | Optional login lockout/brute-force protection. |
| `django-anymail[sendgrid]>=12` | Optional managed email provider integration. |
| `sentry-sdk[django]>=2.19` | Optional production error monitoring. |

## Dev/testing

| Package | Reason |
|---|---|
| `pytest>=8.3,<9` | Test runner. |
| `pytest-django>=4.9,<5` | Django fixtures/database handling. |
| `pytest-cov>=6,<7` | Coverage. |
| `factory-boy>=3.3,<4` | Model factories for API tests. |
| `Faker>=30` | Seed/demo data. |
| `freezegun>=1.5,<2` | Test OTP expiry and placement expiry. |
| `ruff>=0.8,<1` | Lint/format. |
| `django-extensions>=3.2,<4` | `shell_plus`, `show_urls`, etc. |
| `django-debug-toolbar>=4.4,<6` | Query inspection in dev. |
| `mypy>=1.13,<2` + `django-stubs>=5.1,<6` | Optional static typing. |

## Ready-to-run install

PowerShell/CMD one-liner:

```bash
pip install "Django>=5.2,<6.0" "djangorestframework>=3.16,<4" "djangorestframework-simplejwt>=5.5,<6" "django-cors-headers>=4.7,<5" "django-filter>=24.3" "drf-spectacular>=0.28,<1" "django-environ>=0.12,<1" "psycopg[binary]>=3.2,<4" "Pillow>=11.0" "gunicorn>=23.0,<24" "whitenoise>=6.8,<7" "argon2-cffi>=23.1" "celery[redis]>=5.4,<6" "redis>=5.2" "django-celery-beat>=2.7,<3" "django-storages[s3]>=1.14,<2" "boto3>=1.35,<2" "filetype>=1.2,<2"
```

Optional real-time:

```bash
pip install "channels[daphne]>=4.2,<5" "channels-redis>=4.2,<5"
```

Dev:

```bash
pip install "pytest>=8.3,<9" "pytest-django>=4.9,<5" "pytest-cov>=6,<7" "factory-boy>=3.3,<4" "Faker>=30" "freezegun>=1.5,<2" "ruff>=0.8,<1" "django-extensions>=3.2,<4" "django-debug-toolbar>=4.4,<6" "mypy>=1.13,<2" "django-stubs>=5.1,<6"
```

## Suggested `requirements.txt`

```txt
Django>=5.2,<6.0
djangorestframework>=3.16,<4
djangorestframework-simplejwt>=5.5,<6
django-cors-headers>=4.7,<5
django-filter>=24.3
drf-spectacular>=0.28,<1
django-environ>=0.12,<1
psycopg[binary]>=3.2,<4
Pillow>=11.0
gunicorn>=23.0,<24
whitenoise>=6.8,<7
argon2-cffi>=23.1
celery[redis]>=5.4,<6
redis>=5.2
django-celery-beat>=2.7,<3
django-storages[s3]>=1.14,<2
boto3>=1.35,<2
filetype>=1.2,<2
```

Optional additions, commented out until needed:

```txt
# channels[daphne]>=4.2,<5
# channels-redis>=4.2,<5
# django-axes>=7
# django-anymail[sendgrid]>=12
# sentry-sdk[django]>=2.19
```

## Suggested `requirements-dev.txt`

```txt
-r requirements.txt
pytest>=8.3,<9
pytest-django>=4.9,<5
pytest-cov>=6,<7
factory-boy>=3.3,<4
Faker>=30
freezegun>=1.5,<2
ruff>=0.8,<1
django-extensions>=3.2,<4
django-debug-toolbar>=4.4,<6
mypy>=1.13,<2
django-stubs>=5.1,<6
```

Notes:

- `gunicorn` does not run on Windows; use Docker/Linux for production, or `waitress` for a Windows deployment.
- Pin exact versions with `pip freeze` after the first successful install; the bounds above are intentionally conservative.
- `psycopg[binary]` is the simplest Windows/macOS/Linux install.
