# fixth-frontend

React + TypeScript + Vite + Tailwind CSS v4.

## Getting started

```bash
npm install
cp .env.example .env   # then edit values
npm run dev
```

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR           |
| `npm run build`     | Type-check and build for production to `dist/` |
| `npm run typecheck` | Run the TypeScript compiler only             |
| `npm run lint`      | Lint with oxlint                             |
| `npm run preview`   | Preview the production build locally         |

## Project structure

```
.
├── public/                 # Static files served as-is (favicon, robots.txt, ...)
├── src/
│   ├── assets/             # Assets imported by code (images, fonts, icons)
│   ├── components/
│   │   ├── common/         # Generic reusable UI primitives (Button, Input, Modal)
│   │   └── layout/         # App shell pieces (RootLayout, Header, Footer)
│   ├── config/             # App configuration (env access, constants)
│   ├── features/           # Feature modules — each owns its own
│   │                       # components/ hooks/ api/ per feature
│   ├── hooks/              # Shared custom React hooks
│   ├── lib/                # Framework-agnostic helpers (pure functions)
│   ├── pages/              # Route-level components (one per route)
│   ├── routes/             # Router definition
│   ├── services/           # Data access layer (HTTP client, API endpoints)
│   ├── styles/             # Global stylesheet + Tailwind theme tokens
│   ├── types/              # Shared TypeScript types
│   ├── App.tsx             # Root component / providers
│   ├── main.tsx            # Entry point, mounts the app
│   └── vite-env.d.ts       # Vite env typing
├── .env.example            # Documented environment variables
├── index.html              # Vite HTML entry
├── tsconfig*.json          # TypeScript configs (app + node projects)
└── vite.config.ts          # Vite config (React plugin, Tailwind, `@/` alias)
```

## Conventions

- **Path alias.** `@/` maps to `src/`. Always prefer `@/components/...` over `../../`.
- **Pages vs components.** `src/pages/` is only for route-level views wired up in
  `src/routes/index.tsx`. Everything reusable lives in `src/components/`.
- **Features.** As the app grows, group related code under `src/features/<name>/`
  instead of letting `components/` and `services/` grow without bound.
- **Styling.** Tailwind utility classes in JSX. Add shared design tokens in the
  `@theme` block in `src/styles/index.css`.
- **API access.** Call `request()` from `src/services/http.ts`; keep endpoint
  functions in `src/services/`.

## Onboarding and authentication

The landing page links to both onboarding tracks:

- `/onboarding/organization/email`: email → code → details → story → review → complete.
- `/onboarding/student/email`: email → code → about → education → preferences → skills → review → complete.
- `/auth/sign-in` and `/auth/forgot-password` provide the corresponding account screens.

Step definitions live in `src/features/onboarding/flow.ts`. Draft text values and selected file names are saved separately for each track in session storage. Back, refresh, and review edit links preserve these values. File contents are not uploaded or persisted.

These are frontend flows. Email delivery, OTP verification, authentication, file upload, and server-side account creation are not connected to an API. The code screen explicitly identifies preview mode; any six digits let reviewers continue. Completion saves the local draft, rather than creating a verified account.

The auth layout is full-bleed: the proportional desktop split fills the viewport with no outer frame and no page-level scrollbar. At the desktop reference size, the form begins 200px from the top. It scrolls inside the panel when needed so the shell stays put. On mobile the brand banner sits above the white form panel.

## Adding a new page

1. Create `src/pages/ExamplePage.tsx`.
2. Register it in `src/routes/index.tsx`.
3. Link to it with `<Link to="/example" />`.


## Product workspaces

Open `/workspaces` to enter a sample student, company, or Trust & Safety workspace. The sign-in screen also links there, and onboarding completion leads into the corresponding product workspace.

| Experience | Routes |
| --- | --- |
| Student discovery and saved roles | `/student/discover`, `/student/saved` |
| Placement details and canonical share link | `/p/:slug`, `/student/placements/:id` |
| Applications | `/student/applications` |
| Student profile, editing, and resume | `/student/profile`, `/student/profile/edit`, `/student/resume` |
| Company placement management | `/company/placements`, `/company/placements/new`, `/company/placements/:id/edit` |
| Applicants and candidate review | `/company/applicants`, `/company/placements/:id/applicants/:candidateId` |
| Company profile | `/company/profile` |
| Admin verification queue and reviews | `/admin/verification`, `/admin/verification/:type/:id` |
| Moderation, accounts, and audit history | `/admin/listings`, `/admin/accounts`, `/admin/audit` |

The product uses sample records in `src/features/product/data.ts` and a shared session store. Saved roles, applications, profile changes, listing publication/closure, applicant decisions, and moderation actions are interactive. Verification and moderation require a reason and record it in the local audit log. Closing or unpublishing a listing affects student discovery. The canonical slug remains stable when a title changes.

Resume contents remain in memory until refresh; only their filename is stored. A saved filename alone does not represent a server upload. Reference verification documents and candidate resumes have no supplied file contents, and their viewers explain this instead of inventing documents. No real emails, applications, contact messages, account deletions, suspensions, or authorization changes are sent to an external service. All role workspaces are publicly accessible previews and need server authentication and role checks before production use.

## Browser verification

Run `npm run dev`, then start a Chromium browser with a CDP debugging port of `9235` (use a separate disposable browser profile). Run:

```powershell
node scripts/verify-frontend.mjs
```

Set `VERIFY_URL` or `VERIFY_CDP_PORT` to use a different server or browser port. The check starts with a fresh **preview session** in that browser, then exercises onboarding, OTP paste, saving/searching placements, local resume selection, applying, publishing, applicant decisions, copy success/failure, verification, moderation, and audit history. It also checks 31 routes at desktop, tablet, mobile, 320px width, and a 720×512 CSS viewport equivalent to a 1440×1024 window at 200% zoom. Screenshots go to ignored `node_modules/.cache/fixth-verification`.

Accessibility adaptations from the canvas include 12px minimum status/step labels, 16px mobile inputs, responsive rather than fixed-size content, and mobile table rows that reflow into labelled cards. Native dialogs provide Escape handling, background inertness, focus containment, and focus restoration. Copy actions retain focus and expose a selectable canonical URL if both clipboard methods fail. Automated checks do not replace a manual screen-reader and text-only zoom audit.
"# fixth_frontend" 
"# fixth_frontend" 
"# fixth_frontend" 
"# fixth_frontend" 
