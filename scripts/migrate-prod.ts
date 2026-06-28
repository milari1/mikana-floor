import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';

import '../src/lib/db/load-env';

/**
 * Production migration runner, gated by an env flag so it only runs when
 * explicitly requested (e.g. from GitHub Actions on main, before promote).
 * Exits non-zero on failure so the deploy can be held.
 *
 *   RUN_MIGRATIONS=true npm run db:migrate:prod
 */
async function main() {
  if (process.env.RUN_MIGRATIONS !== 'true') {
    console.log('RUN_MIGRATIONS is not "true" — skipping migrations.');
    return;
  }
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is required to run migrations.');
  }

  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: 'src/lib/db/migrations' });
  console.log('Migrations applied successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed — holding deploy:', err);
    process.exit(1);
  });
