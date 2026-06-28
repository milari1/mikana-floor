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
| `npm run dev`   | Start the dev server         |
| `npm run build` | Production build             |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

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
