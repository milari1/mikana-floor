# Mikana Floor

Operational app for a multi-segment food service company (catering, restaurant,
institutional, distribution). Mikana Floor embeds 14 management principles in the
moment of work, surfacing them through role-specific surfaces.

**Design law: the app alerts, humans decide.** The system raises signals and flags
exceptions; people make the calls.

## Role surfaces

| Surface   | Device   | Notes                          |
| --------- | -------- | ------------------------------ |
| Crew      | Phone    | PWA, offline-capable           |
| GM        | Tablet   |                                |
| Director  | Desktop  |                                |
| Auditor   | Any      | Read-only                      |

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript (strict)
- **Styling:** Tailwind CSS, shadcn/ui (Slate base color)
- **Database:** Vercel Postgres (Neon) via Drizzle ORM
- **Auth:** Auth.js (next-auth v5)
- **Email:** Resend
- **PWA:** Serwist (`@serwist/next`)
- **Offline storage:** Dexie (IndexedDB)
- **Icons:** lucide-react
- **Validation:** Zod
- **Passwords:** bcryptjs

## Local development

Prerequisites: Node.js 18.18+ (this project was scaffolded on Node 24) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in the values in .env.local

# 3. Run the dev server
npm run dev
```

The app runs at http://localhost:3000.

### Scripts

| Script          | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`              | Start the dev server                    |
| `npm run build`           | Production build                        |
| `npm run start`           | Serve the production build              |
| `npm run lint`            | Run ESLint                              |
| `npm run db:generate`     | Generate a Drizzle migration            |
| `npm run db:migrate`      | Apply migrations                        |
| `npm run db:seed`         | Seed baseline data                      |
| `npm run db:import-standards` | Import SOPs into the standards table |
| `npm run test:e2e`        | Run Playwright e2e tests                |

## Importing SOPs into standards

SOPs are authored separately as structured JSON (one file per role/station) and
imported into the versioned `standards` table, so authoring an SOP fills the
app's checklist content.

```bash
npm run db:import-standards -- ./seed/restaurant-prep.standards.json
```

The file is an array of standards:

```jsonc
[
  {
    "station": "Line Prep",      // station the standard belongs to
    "phase": "prep",             // opening | prep | service | closing | par-check
    "version": 1,                // optional; ignored when bumping an existing standard
    "title": "Line Prep — Mise en Place",
    "steps": [
      {
        "name": "Sanitize station and tools",
        "detail_md": "Markdown detail shown when the step is expanded.",
        "photo_url": "https://…"  // optional spec photo
      }
    ]
  }
]
```

Import is an upsert keyed by `(station, phase)`. A new version row is inserted
only when the title or steps changed; `supersedes_id` points at the prior
version and `effective_at` is set to now. Unchanged standards are skipped.
Ingredient/par lists use `phase: "par-check"`. The importing user is attributed
via `IMPORT_AUTHOR_EMAIL` (falls back to a director).

## Project structure

```
src/
  app/
    crew/        # Crew surface (phone, PWA)
    gm/          # GM surface (tablet)
    director/    # Director surface (desktop)
    auditor/     # Auditor surface (read-only)
    api/         # Route handlers
  components/
    ui/          # shadcn/ui primitives
    crew/        # Crew-specific components
    gm/          # GM-specific components
    director/    # Director-specific components
  lib/
    db/          # Drizzle schema & client
tests/
  e2e/           # End-to-end tests
  unit/          # Unit tests
```

## Deployment

Deployed on **Vercel**.

1. Push to GitHub (`main` is the production branch).
2. Import the repo in Vercel; production branch `main`, preview for all others.
3. Add the environment variables (below) in the Vercel project settings.
4. Provision a Postgres database (Neon, via the Vercel integration) and set `POSTGRES_URL`.
5. Set `NEXTAUTH_URL` / `AUTH_URL` to the deployed URL.

Pushes to `main` trigger production deploys; other branches get preview deploys.

### Database branches per PR

Use **Neon branching** (Vercel Postgres integration) so each PR gets a branch
forked from production. Point CI's `TEST_POSTGRES_URL` secret at the branch DB.

### Migrations on deploy

`scripts/migrate-prod.ts` runs Drizzle migrations, gated by `RUN_MIGRATIONS=true`,
exiting non-zero on failure so the deploy can be held:

```bash
RUN_MIGRATIONS=true npm run db:migrate:prod
```

Run it from CI on `main` (or a Vercel "deploy hook" / pre-promote step) before
promoting the build. If it fails, hold the deploy.

### Environment variables

| Variable | Used for |
| --- | --- |
| `POSTGRES_URL` | Neon/Vercel Postgres connection |
| `AUTH_SECRET` (`NEXTAUTH_SECRET`) | Auth.js session/JWT signing |
| `NEXTAUTH_URL` | Canonical app URL |
| `RESEND_API_KEY` | Magic-link email (GM+) |
| `AUTH_RESEND_FROM` | Verified magic-link sender |
| `OPENAI_API_KEY` | Kaizen Whisper transcription fallback |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push (server) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push (browser subscribe) |
| `VAPID_SUBJECT` | VAPID JWT contact |

## CI

`.github/workflows/ci.yml` runs on every PR and blocks merge on failure:

- **verify** (DB-free): `typecheck`, `lint`, `test:unit` (Vitest), `build`
- **e2e**: Playwright against a Neon branch DB (`TEST_POSTGRES_URL` secret),
  after `db:migrate:prod` + `db:seed`

## Incident runbook

**Auth**
- *Crew can't sign in:* confirm the user has a `pin_hash` at the selected site
  and is `active`. PINs are bcrypt-compared against users at that `site_id`.
- *GM magic link fails:* check `RESEND_API_KEY` + `AUTH_RESEND_FROM` (verified
  domain) and `AUTH_SECRET`. Only `gm`/`director`/`exec`/`auditor` may use it.
- *Everyone logged out:* a changed `AUTH_SECRET` invalidates all JWTs (8h TTL).

**Push**
- *MODs not receiving stop alerts:* verify `VAPID_*` keys are set and the MOD
  has a row in `push_subscriptions`. Dead subscriptions (404/410) are pruned
  automatically. Push is best-effort — stops are always recorded regardless.
- *No subscription created:* the browser must grant notification permission and
  the Service Worker must be registered (production build only).
