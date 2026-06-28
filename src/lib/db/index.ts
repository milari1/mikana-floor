import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './schema';

/**
 * Drizzle client backed by Vercel Postgres (Neon).
 *
 * `@vercel/postgres` reads the connection string from `POSTGRES_URL`.
 * In the Next.js runtime this is loaded automatically from `.env.local`;
 * standalone scripts (seed/migrate) load it via `./load-env`.
 */
export const db = drizzle(sql, { schema });

export { schema };
export * from './schema';
