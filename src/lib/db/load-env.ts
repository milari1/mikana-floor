import { config } from 'dotenv';

/**
 * Loads environment variables for standalone scripts (seed, migrate) that run
 * outside the Next.js runtime. `.env.local` takes precedence over `.env`.
 *
 * Import this FIRST, before any module that reads `process.env` at import time
 * (e.g. the db client), so the variables are present when those modules load.
 */
config({ path: '.env.local' });
config({ path: '.env' });
