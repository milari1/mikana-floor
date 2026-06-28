import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// `.env.local` takes precedence over `.env` (dotenv does not override
// already-set vars on the second call).
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? '',
  },
  verbose: true,
  strict: true,
});
