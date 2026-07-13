import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db';
import { newRecordToken, upsertOwner } from './recordStore';

// Magic-link auth, two deliberately separate token spaces:
//  - login_tokens: emailed, short-lived (15 min), single-use. Spent once to
//    mint a session; never itself valid as a session.
//  - sessions: long-lived (30 days), presented via an httpOnly cookie.
// Only SHA-256 hashes are ever stored — raw values exist only in the
// emailed URL / the cookie, never at rest in the database.

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const SESSION_COOKIE = 'paw_session';

// Sign-in email throttle, counted against login_tokens rows in Postgres so
// it holds across serverless instances (an in-memory counter would reset
// per instance and silently fail open in production). Per-email only: a
// per-client dimension needs either a hashed-client column or an external
// limiter — a separate decision, deliberately not improvised here.
const LOGIN_LINK_BURST_LIMIT = 3; // per email per 15 minutes
const LOGIN_LINK_DAILY_LIMIT = 10; // per email per 24 hours

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// ---------------------------------------------------------------------------
// Login tokens (magic link)
// ---------------------------------------------------------------------------

export interface LoginToken {
  rawToken: string;
  ownerId: string;
  expiresAt: string;
}

/**
 * Upserts the owner and issues a new 15-minute, single-use login token, or
 * 'limited' when this email has hit the sign-in link throttle. The check
 * counts issued tokens rather than locking, so a concurrent burst can
 * overshoot by a request or two — acceptable for an email throttle, and it
 * behaves identically for brand-new and long-standing emails (no
 * account-enumeration signal).
 */
export async function createLoginToken(email: string, name?: string): Promise<LoginToken | 'limited'> {
  const ownerId = await upsertOwner(email, name);
  const counts = await query<{ recent: string; daily: string }>(
    `SELECT
       count(*) FILTER (WHERE created_at > now() - interval '15 minutes') AS recent,
       count(*) AS daily
     FROM login_tokens
     WHERE owner_id = $1 AND created_at > now() - interval '24 hours'`,
    [ownerId],
  );
  if (Number(counts[0].recent) >= LOGIN_LINK_BURST_LIMIT || Number(counts[0].daily) >= LOGIN_LINK_DAILY_LIMIT) {
    return 'limited';
  }
  const rawToken = newRecordToken();
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);
  await query(
    `INSERT INTO login_tokens (owner_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [ownerId, hashToken(rawToken), expiresAt.toISOString()],
  );
  return { rawToken, ownerId, expiresAt: expiresAt.toISOString() };
}

export interface NewSession {
  rawToken: string;
  ownerId: string;
  expiresAt: string;
}

/**
 * Atomically claims a login token (fails if already used or expired — this
 * is what makes reuse and expiry both safe under concurrent verify requests)
 * and mints a brand-new, separate session token for the owner it belonged
 * to. Returns null for any invalid/expired/already-used token; callers
 * should not distinguish these cases to the visitor.
 */
export async function consumeLoginToken(rawToken: string): Promise<NewSession | null> {
  if (!isPlausibleToken(rawToken)) return null;
  const claimed = await query<{ owner_id: string }>(
    `UPDATE login_tokens
     SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING owner_id`,
    [hashToken(rawToken)],
  );
  if (claimed.length === 0) return null;
  return createSessionForOwner(claimed[0].owner_id);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/** Mints a new session directly, bypassing the login-token exchange — used
 *  right after intake auto-signs-in a first-time visitor (see /api/intake). */
export async function createSessionForOwner(ownerId: string): Promise<NewSession> {
  const rawToken = newRecordToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query(
    `INSERT INTO sessions (owner_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [ownerId, hashToken(rawToken), expiresAt.toISOString()],
  );
  return { rawToken, ownerId, expiresAt: expiresAt.toISOString() };
}

export interface SessionOwner {
  ownerId: string;
  email: string;
  name: string | null;
}

/** Null for a missing, expired, or malformed token — never throws on bad input. */
export async function getOwnerBySessionToken(rawToken: string): Promise<SessionOwner | null> {
  if (!isPlausibleToken(rawToken)) return null;
  const rows = await query<{ owner_id: string; email: string; name: string | null }>(
    `SELECT o.id AS owner_id, o.email, o.name
     FROM sessions s JOIN owners o ON o.id = s.owner_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(rawToken)],
  );
  if (rows.length === 0) return null;
  return { ownerId: rows[0].owner_id, email: rows[0].email, name: rows[0].name };
}

/**
 * The owner behind the current request's paw_session cookie, or null when
 * there is no cookie or the session is invalid/expired. The one way private
 * routes resolve "who is asking" — owner identity must always come from
 * here, never from a request body or URL.
 */
export async function getSessionOwner(): Promise<SessionOwner | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? getOwnerBySessionToken(token) : null;
}

/** Idempotent — deleting an already-gone or unknown token is not an error. */
export async function deleteSession(rawToken: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(rawToken)]);
}

/** Shape check only — says nothing about validity. Exported so the verify
 *  interstitial can reject junk without touching the database. */
export function isPlausibleToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

/**
 * Validates a post-sign-in destination. Accepts only same-site relative
 * paths ("/dashboard", "/record/abc"); rejects absolute URLs,
 * protocol-relative ("//evil.com"), backslash tricks, and control
 * characters. Null means "use the default destination" — never redirect to
 * a raw caller-supplied value.
 */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c < 0x20 || c === 0x7f || value[i] === '\\') return null;
  }
  return value;
}
