import { Pool, type QueryResultRow } from 'pg';

// Server-only Postgres access, gated entirely on DATABASE_URL. When it is
// unset the app behaves exactly as it did before this module existed
// (device-local record, n8n email path) — every caller must check
// isDbConfigured() before touching query().

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Small pool: on serverless each instance serves few concurrent requests,
    // and providers like Neon expect pooled connection strings anyway.
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  }
  return pool;
}

// Additive-only and idempotent so a fresh database self-provisions on first
// use — there is no migration tool anyone has to remember to run. Any schema
// change must stay IF NOT EXISTS / purely additive.
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS owners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS pets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    record_token text UNIQUE NOT NULL,
    name text NOT NULL,
    species text NOT NULL,
    breed text,
    age text,
    sex text,
    weight text,
    conditions text,
    medications text,
    vet_clinic text,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS record_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('summary','weight','vaccination','medication','qol','reminder','note')),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS record_entries_pet_created_idx
    ON record_entries (pet_id, created_at DESC);

  -- Short-lived, single-use magic-link tokens. Deliberately separate from
  -- sessions below: a login token is spent exactly once (used_at) to mint
  -- a session -- it is never itself a valid session. Only the SHA-256 hash
  -- is stored; the raw value exists only in the emailed URL.
  CREATE TABLE IF NOT EXISTS login_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    token_hash text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS login_tokens_hash_idx ON login_tokens (token_hash);

  -- Authenticated sessions, presented via an httpOnly cookie. Only the
  -- SHA-256 hash is stored; the raw value exists only in the cookie.
  CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    token_hash text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS sessions_hash_idx ON sessions (token_hash);
`;

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        // Don't cache a failed attempt — the next request retries.
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

/**
 * Run a parameterized query and return its rows. jsonb parameters must be
 * passed pre-stringified (with an explicit ::jsonb cast in the SQL) so the
 * parameter list stays plain strings/null.
 */
export async function query<R extends QueryResultRow>(
  text: string,
  params?: ReadonlyArray<string | null>,
): Promise<R[]> {
  await ensureSchema();
  const result = await getPool().query<R>(text, params ? [...params] : undefined);
  return result.rows;
}

/**
 * Releases the connection pool. Only for scripts and preflight tests that
 * run outside the server lifecycle — the app itself never calls this, since
 * a serverless instance keeps its pool for as long as it lives.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    const p = pool;
    pool = null;
    schemaReady = null;
    await p.end();
  }
}
