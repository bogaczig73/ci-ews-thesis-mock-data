import { neon } from '@neondatabase/serverless';

// Single shared SQL tag bound to the Neon HTTP driver. Reads DATABASE_URL
// (set in Vercel project env, or .env.local for local dev / seeding).
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  // Surface a clear message instead of a cryptic driver error at request time.
  console.warn('[db] DATABASE_URL is not set — database queries will fail.');
}

export const sql = neon(connectionString);
