# Fixth Backend Specification — Data Model

## Modeling conventions

- UUID primary keys for all public resources.
- `created_at`/`updated_at` on mutable business models.
- Use `DecimalField` for money, not float.
- Use `PROTECT`/soft delete where history matters (`Application`, `AuditLog`).
- Enforce state transitions in serializers/services, not only in views.
- Use `select_related`/`prefetch_related` and annotated counts in list querysets.

## `accounts.User`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | `EmailField(unique=True)` | `USERNAME_FIELD = "email"`; normalize lowercase; `UniqueConstraint(Lower("email"))` |
| `password` | char | Argon2 first in `PASSWORD_HASHERS` |
| `role` | char choices | `student`, `company`, `admin` |
| `account_status` | char choices | `active`, `suspended`, `deleted` |
| `email_verified_at` | datetime null | set by OTP verification |
| `is_staff`, `is_superuser`, `is_active` | bool | Django admin compatibility |
| `suspended_at`, `suspension_reason` | datetime/text null | |
| `date_joined`, `last_login` | datetime | |

Relations: 1:1 `StudentProfile`; FK from `Company` (owner/member); 1:N `Document`, `AuditLog`, `Notification`.

## `accounts.OTPCode`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | `EmailField` | not necessarily a User yet |
| `track` | char choices | `student`, `organization` |
| `purpose` | char choices | `onboarding`, `password_reset`, `login` |
| `code_hash` | char | hash, never store plain code |
| `expires_at` | datetime | default 10 min |
| `consumed_at` | datetime null | |
| `attempts` | positive int | default 0; cap 5 |
| `ip` | inet/generic | throttling/audit |
| `created_at` | datetime | |

Constraints/indexes: `(email, track, purpose, created_at)`, partial “one active unconsumed code” per email/purpose.

## `profiles.StudentProfile`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user` | OneToOne `User` | `related_name="student_profile"` |
| `first_name`, `last_name` | char | required |
| `phone` | char blank | |
| `location` | char | required |
| `institution` | char | required |
| `discipline` | FK `Discipline` | `PROTECT`; created on demand from the student's input |
| `level` | positive small int | validators 100–700; “Graduate” needs a mapping or separate flag |
| `graduation_year` | positive small int null | validators 2000–2100 |
| `student_id` | char blank | sensitive; restrict visibility |
| `start_date` | date null | collected in onboarding but currently discarded (`OnboardingPage.tsx:46-50`) |
| `duration` | char | free text currently (`"3–6 months"`, `"6 months"`) |
| `work_styles` | JSON list | profile supports multiple (`"Hybrid · Remote"`) |
| `portfolio` | URL blank | |
| `interests` | text blank | |
| `skills` | M2M `Skill` through `StudentSkill` | API accepts `string[]` |
| `photo` | FK `Document` null | `kind="profile_photo"` |
| `resume` | FK `Document` null | `kind="resume"`; current active resume |
| `verification_status` | char choices | `Pending`, `Verified`, `Rejected` |
| `risk_level` | char choices | `Low`, `Medium`, `Review` |
| `deleted_at` | datetime null | soft delete/anonymize |
| `created_at`, `updated_at` | datetime | |

`profile_strength` is computed from the 10 fields in `data.ts:56-59`; expose as a read-only int.

## `profiles.Skill`, `profiles.SkillAlias`, and `profiles.StudentSkill`

| Model | Fields |
|---|---|
| `Skill` | `id`, `name`, `normalized_name` unique, `slug` unique |
| `SkillAlias` | `id`, `name`, `alias_key` unique, `skill` FK |
| `StudentSkill` | `student` FK, `skill` FK, unique together; optional `weight` |

Skills are created automatically from student input; there is no seed list. Lookup is case-insensitive through `normalized_name`. Technical symbols are preserved so `C`, `C++`, and `C#` remain distinct. Skills do not use fuzzy matching, so `Java` and `JavaScript` also remain separate. The API accepts either `string[]` or a comma/`·`-delimited string.

## `companies.Company`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `owner` | FK `User` | or M2M `members`; see open question Q7 |
| `name` | char | |
| `slug` | slug unique | stable |
| `website` | URL blank | onboarding treats it as text; normalize |
| `industry` | char choices | Technology, Engineering, Construction, Manufacturing, Energy, Other (`flow.ts:9`) |
| `description` | text, max 500 | onboarding textarea limit (`OnboardingPage.tsx:78`) |
| `country`, `city`, `address` | char | |
| `logo` | FK `Document` null | `kind="logo"` |
| `registration_number` | char blank | shown as `RC 1840291` (`CompanyPages.tsx:54-56`) |
| `primary_contact_name`, `primary_contact_title` | char blank | shown as `Bola Okafor · Head of Talent` |
| `verification_status` | char choices | `Pending`, `Verified`, `Rejected` |
| `risk_level` | char choices | `Low`, `Medium`, `Review` |
| `created_at`, `updated_at` | datetime | |

## `profiles.Discipline` and `profiles.DisciplineAlias`

| Model | Fields |
|---|---|
| `Discipline` | `id`, `name`, `normalized_name` unique, `slug` unique |
| `DisciplineAlias` | `id`, `name`, `alias_key` unique, `discipline` FK |

Disciplines are created automatically from student and company input; there is no seed list. Exact normalized matches are reused. Conservative automatic matching handles typo-level variants and token abbreviations such as `Computer Eng.` → `Computer Engineering`, then stores the variant as an alias. Distinct fields such as `Civil Engineering` and `Environmental Engineering` remain separate. No admin approval or merge step is required.

## `placements.Placement`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `slug` | slug unique | immutable after create |
| `company` | FK `Company` | `PROTECT` |
| `title` | char | |
| `location` | char | |
| `work_style` | char choices | `Hybrid`, `Remote`, `On-site` |
| `duration` | char | free text/choices (`3 months`, `4 months`, `6 months`, `12 months`) |
| `discipline` | FK `Discipline` | |
| `level` | positive small int | minimum level, 100–700 |
| `stipend_amount` | decimal(12,2) null | |
| `currency` | char(3) default `NGN` | |
| `description`, `responsibilities`, `requirements` | text | |
| `status` | char choices | `Active`, `Draft`, `Closed`, `Expired`, `Unpublished` |
| `reports_count` | positive int default 0 | denormalized from `PlacementReport` or annotated |
| `published_at`, `closed_at`, `expires_at` | datetime null | expiry not in UI today |
| `created_by` | FK `User` | |
| `created_at`, `updated_at` | datetime | |

Indexes: `(status, discipline, location)`, `(company, status)`, `slug`. `match_score` is **not** stored; compute per student (see open question Q9).

## `placements.SavedPlacement`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `student` | FK `StudentProfile` | |
| `placement` | FK `Placement` | |
| `created_at` | datetime | |

`UniqueConstraint(student, placement)`. Delete on unsave.

## `applications.Application`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `placement` | FK `Placement` | `PROTECT` |
| `student` | FK `StudentProfile` | `PROTECT` or soft-delete |
| `resume` | FK `Document` null | snapshot of resume at apply time; `SET_NULL` |
| `status` | char choices | `Submitted`, `Viewed`, `Shortlisted`, `Rejected`, `Accepted` |
| `applied_at` | datetime auto_now_add | |
| `status_changed_at` | datetime | |
| `decided_by` | FK `User` null | company user |
| `rejection_reason` | text blank | optional |
| `cover_note` | text blank | not in UI; optional |

`UniqueConstraint(placement, student)`. Indexes `(student, status)`, `(placement, status)`.

## `applications.ApplicationEvent`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application` | FK `Application` | |
| `from_status`, `to_status` | char | |
| `actor` | FK `User` null | |
| `reason` | text blank | |
| `created_at` | datetime | |

Used by the “Status updates” rail (`StudentPlacements.tsx:59`) and for company-side history.

## `common.Document`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `owner` | FK `User` | |
| `kind` | char choices | `profile_photo`, `resume`, `logo`, `verification_evidence`, `placement_attachment` |
| `file` | `FileField(upload_to=...)` | per-kind/year/month |
| `original_name` | char | |
| `mime_type` | char | sniffed, not trusted from client |
| `size` | positive int | |
| `checksum` | char blank | dedupe/integrity |
| `is_private` | bool | true for resume/evidence |
| `scan_status` | char | `pending`, `clean`, `infected`, `skipped` |
| `created_at` | datetime | |

Validators:

- resume: `.pdf`, `.doc`, `.docx`, ≤5 MB (`StudentProfile.tsx:51-57`).
- photo: PNG/JPEG/WebP, ≤2 MB (`StudentProfile.tsx:41`).
- evidence: PDF/JPG/JPEG/PNG, ≤5 MB (`OnboardingPage.tsx:68-74`).
- logo: image, ≤5 MB (same onboarding upload cap).

## `verification.VerificationRequest`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `kind` | char choices | `student`, `company` |
| `student` | FK `StudentProfile` null | exactly one of student/company |
| `company` | FK `Company` null | |
| `status` | char choices | `Pending`, `Approved`, `Rejected` |
| `risk_level` | char choices | `Low`, `Medium`, `Review` |
| `submitted_at` | datetime | |
| `decided_by` | FK `User` null | |
| `decided_at` | datetime null | |
| `decision_reason` | text blank | required on decision |
| `evidence` | M2M `Document` | |

Constraints: `CheckConstraint` exactly one subject; partial unique pending request per student/company. `subject_label` property for the audit/queue.

## `moderation.PlacementReport`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `placement` | FK `Placement` | |
| `reporter` | FK `User` null | anonymous reports possible |
| `reason` | char choices | `spam`, `misleading`, `discrimination`, `other` |
| `details` | text | |
| `status` | char choices | `open`, `resolved` |
| `created_at`, `resolved_at` | datetime | |
| `resolved_by` | FK `User` null | |

`reports_count` on `Placement` can be a counter cache updated on create/resolve, or annotated.

## `audit.AuditLog`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `actor` | FK `User` null | `SET_NULL` |
| `action` | char choices | `approve_verification`, `reject_verification`, `unpublish_listing`, `restore_listing`, `suspend_account`, `restore_account`, `application_status_change`, `publish_listing` |
| `subject_type` | char | `student`, `company`, `placement`, `application`, `account` |
| `subject_id` | UUID/char | |
| `subject_label` | char | snapshot at action time |
| `reason` | text | required for moderation/verification |
| `metadata` | JSON | before/after state |
| `ip`, `user_agent` | char/text | |
| `created_at` | datetime | indexed |

Make this model append-only (override `save`/`delete` or restrict admin). Store `subject_label` so deleted/anonymized records still render in the audit table (`AdminPages.tsx:65-68`).

## `notifications.Notification` (inferred)

`id`, `user` FK, `kind`, `title`, `body`, `data` JSON, `read_at` null, `created_at`. No UI consumes it yet.

## Serializers and viewsets

| Resource | Serializers | View / ViewSet | Permissions |
|---|---|---|---|
| Auth/User | `UserSerializer`, `MeSerializer` | `OTPRequestView`, `OTPVerifyView`, `SignInView(TokenObtainPairView)`, `RefreshView`, `LogoutView`, `PasswordResetRequestView`, `PasswordResetConfirmView`, `MeView` | `AllowAny` / `IsAuthenticated` |
| Student profile | `StudentProfileReadSerializer`, `StudentProfileWriteSerializer`, `ResumeSerializer`, `PhotoSerializer` | `StudentProfileViewSet` (me routes) or APIViews | `IsStudent`, object owner |
| Company | `CompanyReadSerializer`, `CompanyWriteSerializer` | `CompanyProfileView`, `CompanyPlacementViewSet` | `IsCompany`, owner |
| Placement | `PlacementListSerializer`, `PlacementDetailSerializer`, `PlacementWriteSerializer` | `PlacementViewSet` (public read + `save`/`report` actions), `CompanyPlacementViewSet`, `AdminPlacementViewSet` | `AllowAny`/`IsStudent`/`IsCompany`/`IsAdminUser` |
| Saved | `SavedPlacementSerializer` | actions on `PlacementViewSet` or separate view | `IsStudent` |
| Application | `StudentApplicationCreateSerializer`, `StudentApplicationReadSerializer`, `CompanyApplicationReadSerializer`, `ApplicationStatusSerializer` | `ApplicationViewSet`, `CompanyApplicationViewSet` | student owner / company owner / admin |
| Verification | `VerificationRequestReadSerializer`, `VerificationDecisionSerializer` | `VerificationRequestViewSet` + `decision` action | `IsAdminUser` |
| Moderation/accounts | `AdminAccountSerializer` | `AdminAccountViewSet` + `suspend`/`restore` actions | `IsAdminUser` |
| Audit | `AuditLogSerializer` | `AuditLogViewSet` (read-only) | `IsAdminUser` |
| Reference | `SkillSerializer`, `DisciplineSerializer` | read-only list views (`/api/v1/skills/`, `/api/v1/disciplines/`) | `AllowAny` |
| Documents | `DocumentSerializer` | `DocumentDownloadView` | owner/company/admin |

Recommended DRF settings:

- `DEFAULT_AUTHENTICATION_CLASSES = ["rest_framework_simplejwt.authentication.JWTAuthentication"]`
- `DEFAULT_PERMISSION_CLASSES = ["rest_framework.permissions.IsAuthenticated"]`; opt into `AllowAny` on public endpoints.
- `DEFAULT_PAGINATION_CLASS = "rest_framework.pagination.PageNumberPagination"`, `PAGE_SIZE = 20`, `page_size_query_param = "page_size"`, `max_page_size = 100`.
- `DEFAULT_FILTER_BACKENDS = ["django_filters.rest_framework.DjangoFilterBackend", "rest_framework.filters.SearchFilter", "rest_framework.filters.OrderingFilter"]`
- `DEFAULT_PARSER_CLASSES = ["JSONParser", "MultiPartParser", "FormParser"]`

## Seed/demo data

For demo parity, create fixtures matching `src/features/product/data.ts:24-53`:

- 8 placements (`pl-1`…`pl-8` equivalents, stable slugs).
- Nova Labs as the company account owning `nova-frontend` / `nova-design-draft`.
- 6 student profiles corresponding to `initialCandidates` (`c-1`…`c-6`).
- 4 applications corresponding to `initialApplications` (`ap-1`…`ap-4`).
- One student profile matching `initialProfile` (`Ayo Ogun`).
- Admin user for Trust & Safety.

This lets the existing UI be wired to the API with recognizable data.
