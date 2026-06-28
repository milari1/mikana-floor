import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import '../src/lib/db/load-env';
import { db } from '../src/lib/db';
import { standards, users } from '../src/lib/db/schema';

/**
 * Import SOPs (authored separately as structured JSON) into the versioned
 * `standards` table. Authoring an SOP fills the app's checklist content.
 *
 * Usage:
 *   npm run db:import-standards -- ./seed/restaurant-prep.standards.json
 *
 * Behaviour: upsert keyed by (station, phase). A new version row is inserted
 * only when the title or steps changed; supersedes_id points at the prior
 * version and effective_at is set to now. Unchanged standards are skipped.
 * Ingredient/par lists use phase "par-check".
 */
const stepSchema = z.object({
  name: z.string().min(1),
  detail_md: z.string().optional(),
  photo_url: z.string().optional(),
});

const standardSchema = z.object({
  station: z.string().min(1),
  phase: z.string().min(1),
  version: z.number().int().positive().optional(),
  title: z.string().optional(),
  steps: z.array(stepSchema),
});

const fileSchema = z.array(standardSchema);

async function resolveAuthorId(): Promise<string> {
  const email = process.env.IMPORT_AUTHOR_EMAIL;
  if (email) {
    const byEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (byEmail[0]) return byEmail[0].id;
    throw new Error(`No user found for IMPORT_AUTHOR_EMAIL=${email}`);
  }
  // Default: a director, else any user.
  const director = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'director'))
    .limit(1);
  if (director[0]) return director[0].id;
  const any = await db.select({ id: users.id }).from(users).limit(1);
  if (any[0]) return any[0].id;
  throw new Error('No users in the database to attribute the import to.');
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npm run db:import-standards -- <path-to-json>');
    process.exit(1);
  }

  const raw = readFileSync(resolve(process.cwd(), arg), 'utf8');
  const items = fileSchema.parse(JSON.parse(raw));
  const authorId = await resolveAuthorId();

  let inserted = 0;
  let bumped = 0;
  let skipped = 0;

  for (const item of items) {
    const latestRows = await db
      .select()
      .from(standards)
      .where(
        and(eq(standards.station, item.station), eq(standards.phase, item.phase)),
      )
      .orderBy(desc(standards.version))
      .limit(1);
    const latest = latestRows[0];

    const incomingSteps = JSON.stringify(item.steps);
    const title = item.title ?? null;

    if (!latest) {
      await db.insert(standards).values({
        station: item.station,
        phase: item.phase,
        title,
        version: item.version ?? 1,
        stepsJson: item.steps,
        effectiveAt: new Date(),
        authorId,
      });
      inserted++;
      continue;
    }

    const unchanged =
      JSON.stringify(latest.stepsJson ?? []) === incomingSteps &&
      (latest.title ?? null) === title;
    if (unchanged) {
      skipped++;
      continue;
    }

    await db.insert(standards).values({
      station: item.station,
      phase: item.phase,
      title,
      version: latest.version + 1,
      stepsJson: item.steps,
      effectiveAt: new Date(),
      supersedesId: latest.id,
      authorId,
    });
    bumped++;
  }

  console.log(
    `Imported standards — new: ${inserted}, new versions: ${bumped}, unchanged: ${skipped}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
