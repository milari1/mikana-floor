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
2. Import the repo in Vercel.
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Provision a Postgres database (Neon, via the Vercel integration) and set `POSTGRES_URL`.
5. Set `NEXTAUTH_URL` to the deployed URL.

Pushes to `main` trigger production deploys; other branches get preview deploys.
