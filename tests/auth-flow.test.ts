import { createHash, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Auth-entry hardening tests: sign-in link rate limiting, scanner-safe
// magic-link verification (GET mutates nothing, POST consumes once), safe
// returnTo handling, and the header's booleans-only session endpoint. Same
// in-memory Postgres fake pattern as record-authorization.test.ts: it
// emulates exactly the SQL auth.ts issues and throws on anything else.

interface OwnerRow { id: string; email: string; name: string | null }
interface LoginTokenRow { owner_id: string; token_hash: string; expires_at: Date; used_at: Date | null; created_at: Date }
interface SessionRow { owner_id: string; token_hash: string; expires_at: Date }

const db = {
  owners: [] as OwnerRow[],
  login_tokens: [] as LoginTokenRow[],
  sessions: [] as SessionRow[],
};
let dbConfigured = true;
let dbQueryCount = 0;

function fakeQuery(text: string, params: ReadonlyArray<string | null> = []): Record<string, unknown>[] {
  dbQueryCount++;
  const sql = text.replace(/\s+/g, ' ').trim();

  if (sql.startsWith('INSERT INTO owners')) {
    const email = params[0] as string;
    const existing = db.owners.find((o) => o.email === email);
    if (existing) {
      existing.name = existing.name ?? (params[1] as string | null);
      return [{ id: existing.id }];
    }
    const row: OwnerRow = { id: randomUUID(), email, name: params[1] as string | null };
    db.owners.push(row);
    return [{ id: row.id }];
  }

  if (sql.includes('FILTER (WHERE created_at >') && sql.includes('FROM login_tokens')) {
    const now = Date.now();
    const dayRows = db.login_tokens.filter(
      (t) => t.owner_id === params[0] && now - t.created_at.getTime() < 24 * 60 * 60 * 1000,
    );
    const recent = dayRows.filter((t) => now - t.created_at.getTime() < 15 * 60 * 1000);
    return [{ recent: String(recent.length), daily: String(dayRows.length) }];
  }

  if (sql.startsWith('INSERT INTO login_tokens')) {
    db.login_tokens.push({
      owner_id: params[0] as string,
      token_hash: params[1] as string,
      expires_at: new Date(params[2] as string),
      used_at: null,
      created_at: new Date(),
    });
    return [];
  }

  if (sql.startsWith('UPDATE login_tokens') && sql.includes('RETURNING owner_id')) {
    const row = db.login_tokens.find(
      (t) => t.token_hash === params[0] && t.used_at === null && t.expires_at.getTime() > Date.now(),
    );
    if (!row) return [];
    row.used_at = new Date();
    return [{ owner_id: row.owner_id }];
  }

  if (sql.startsWith('INSERT INTO sessions')) {
    db.sessions.push({
      owner_id: params[0] as string,
      token_hash: params[1] as string,
      expires_at: new Date(params[2] as string),
    });
    return [];
  }

  if (sql.includes('FROM sessions s JOIN owners o')) {
    return db.sessions
      .filter((s) => s.token_hash === params[0] && s.expires_at.getTime() > Date.now())
      .map((s) => {
        const owner = db.owners.find((o) => o.id === s.owner_id)!;
        return { owner_id: owner.id, email: owner.email, name: owner.name };
      });
  }

  if (sql.startsWith('DELETE FROM sessions')) {
    db.sessions = db.sessions.filter((s) => s.token_hash !== params[0]);
    return [];
  }

  throw new Error(`fake db has no handler for: ${sql}`);
}

vi.mock('@/lib/server/db', () => ({
  isDbConfigured: () => dbConfigured,
  query: async (text: string, params?: ReadonlyArray<string | null>) => fakeQuery(text, params),
}));

let sentEmails: Array<{ to: string; verifyUrl: string }> = [];
vi.mock('@/lib/server/email', () => ({
  isEmailConfigured: () => true,
  sendLoginLinkEmail: async (input: { to: string; verifyUrl: string }) => {
    sentEmails.push(input);
    return { ok: true };
  },
}));

let cookieValue: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'paw_session' && cookieValue !== undefined ? { name, value: cookieValue } : undefined,
  }),
}));

import { POST as requestPost } from '@/app/api/auth/request/route';
import * as verifyRoute from '@/app/api/auth/verify/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { safeInternalPath } from '@/lib/server/auth';
import VerifyPage from '@/app/signin/verify/page';

const sha256 = (raw: string) => createHash('sha256').update(raw).digest('hex');

function requestLink(email: string, returnTo?: unknown): Promise<Response> {
  return requestPost(
    new Request('http://localhost/api/auth/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(returnTo === undefined ? { email } : { email, returnTo }),
    }),
  );
}

function verifyPost(fields: Record<string, string>): Promise<Response> {
  return verifyRoute.POST(
    new Request('http://localhost/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
  );
}

/** The raw login token from the most recently sent email's verify URL. */
function lastEmailedToken(): string {
  const url = new URL(sentEmails[sentEmails.length - 1].verifyUrl);
  return url.searchParams.get('token')!;
}

beforeEach(() => {
  db.owners = [];
  db.login_tokens = [];
  db.sessions = [];
  dbConfigured = true;
  dbQueryCount = 0;
  sentEmails = [];
  cookieValue = undefined;
});

describe('sign-in link rate limiting (/api/auth/request)', () => {
  it('allows requests under the burst limit', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await requestLink('maya@example.com');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(sentEmails).toHaveLength(3);
  });

  it('limits the request over the burst cap and sends no email for it', async () => {
    for (let i = 0; i < 3; i++) await requestLink('maya@example.com');
    const res = await requestLink('maya@example.com');
    expect(res.status).toBe(429);
    expect(sentEmails).toHaveLength(3);
  });

  it('allows again once the burst window has passed', async () => {
    for (let i = 0; i < 3; i++) await requestLink('maya@example.com');
    for (const row of db.login_tokens) {
      row.created_at = new Date(Date.now() - 16 * 60 * 1000);
    }
    const res = await requestLink('maya@example.com');
    expect(res.status).toBe(200);
  });

  it('enforces the daily cap even outside the burst window', async () => {
    const ownerRes = await requestLink('maya@example.com');
    expect(ownerRes.status).toBe(200);
    const ownerId = db.owners[0].id;
    db.login_tokens = Array.from({ length: 10 }, () => ({
      owner_id: ownerId,
      token_hash: sha256(randomUUID()),
      expires_at: new Date(Date.now() - 1000),
      used_at: null,
      created_at: new Date(Date.now() - 60 * 60 * 1000), // 1h ago: outside burst, inside 24h
    }));
    const res = await requestLink('maya@example.com');
    expect(res.status).toBe(429);
  });

  it('limits are per email — another email is unaffected', async () => {
    for (let i = 0; i < 3; i++) await requestLink('maya@example.com');
    const res = await requestLink('sam@example.com');
    expect(res.status).toBe(200);
  });

  it('responds identically for brand-new and long-standing emails (no enumeration signal)', async () => {
    db.owners.push({ id: randomUUID(), email: 'old@example.com', name: 'Old Owner' });
    const existing = await requestLink('old@example.com');
    const brandNew = await requestLink('new@example.com');
    expect(existing.status).toBe(brandNew.status);
    expect(await existing.json()).toEqual(await brandNew.json());

    for (let i = 0; i < 3; i++) await requestLink('bursty@example.com');
    const limited = await requestLink('bursty@example.com');
    const limitedBody = await limited.json();
    expect(JSON.stringify(limitedBody)).not.toContain('bursty');
  });

  it('emailed link points at the local origin in non-production and targets the no-mutation page', async () => {
    await requestLink('maya@example.com');
    const url = new URL(sentEmails[0].verifyUrl);
    expect(url.origin).toBe('http://localhost:3000');
    expect(url.pathname).toBe('/signin/verify');
  });
});

describe('magic-link verification is scanner-safe', () => {
  it('exposes no GET handler on /api/auth/verify', () => {
    expect((verifyRoute as Record<string, unknown>).GET).toBeUndefined();
  });

  it('rendering the emailed landing page consumes nothing and never touches the database', async () => {
    await requestLink('maya@example.com');
    const token = lastEmailedToken();
    const before = dbQueryCount;
    await VerifyPage({ searchParams: Promise.resolve({ token }) });
    expect(dbQueryCount).toBe(before);
    expect(db.login_tokens[0].used_at).toBeNull();

    // The same token still signs in afterwards — a scanner "visit" is free.
    const res = await verifyPost({ token });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('consumes the token exactly once: a second POST gets the generic expired redirect', async () => {
    await requestLink('maya@example.com');
    const token = lastEmailedToken();

    const first = await verifyPost({ token });
    expect(first.status).toBe(303);
    expect(first.headers.get('set-cookie')).toContain('paw_session=');
    expect(db.sessions).toHaveLength(1);

    const second = await verifyPost({ token });
    expect(second.headers.get('location')).toBe('http://localhost/signin?error=expired');
    expect(db.sessions).toHaveLength(1);
  });

  it('expired, invalid, and missing tokens all get safe generic redirects', async () => {
    await requestLink('maya@example.com');
    db.login_tokens[0].expires_at = new Date(Date.now() - 1000);
    const expired = await verifyPost({ token: lastEmailedToken() });
    expect(expired.headers.get('location')).toBe('http://localhost/signin?error=expired');

    const garbage = await verifyPost({ token: 'garbage-token-000000000001' });
    expect(garbage.headers.get('location')).toBe('http://localhost/signin?error=expired');

    const missing = await verifyPost({});
    expect(missing.headers.get('location')).toBe('http://localhost/signin?error=invalid');
    expect(db.sessions).toHaveLength(0);
  });
});

describe('returnTo (open-redirect safety)', () => {
  it('safeInternalPath accepts only same-site relative paths', () => {
    expect(safeInternalPath('/dashboard')).toBe('/dashboard');
    expect(safeInternalPath('/record/abc-123')).toBe('/record/abc-123');
    for (const bad of [
      'https://evil.com/phish',
      'http://evil.com',
      '//evil.com',
      '/\\evil.com',
      'javascript:alert(1)',
      'dashboard',
      '',
      '/line\nbreak',
      '/' + 'a'.repeat(600),
      42,
      null,
      undefined,
    ]) {
      expect(safeInternalPath(bad)).toBeNull();
    }
  });

  it('honors a safe returnTo through the full flow', async () => {
    await requestLink('maya@example.com', '/record/record-token-pet-a-0001');
    const url = new URL(sentEmails[0].verifyUrl);
    expect(url.searchParams.get('returnTo')).toBe('/record/record-token-pet-a-0001');

    const res = await verifyPost({ token: lastEmailedToken(), returnTo: '/record/record-token-pet-a-0001' });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('http://localhost/record/record-token-pet-a-0001');
  });

  it('drops a malicious returnTo at the request stage', async () => {
    await requestLink('maya@example.com', 'https://evil.com/phish');
    const url = new URL(sentEmails[0].verifyUrl);
    expect(url.searchParams.get('returnTo')).toBeNull();
  });

  it('never redirects to a malicious returnTo posted straight to verify', async () => {
    // Even if an attacker bypasses the request stage and posts the form
    // themselves, verify re-validates and falls back to /dashboard.
    await requestLink('maya@example.com');
    const res = await verifyPost({ token: lastEmailedToken(), returnTo: '//evil.com' });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });
});

describe('header session state and sign-out', () => {
  it('reports auth unavailable when the database is not configured', async () => {
    dbConfigured = false;
    const res = await sessionGet();
    expect(await res.json()).toEqual({ available: false, signedIn: false });
  });

  it('reports signed-out and signed-in states with booleans only', async () => {
    const anonymous = await (await sessionGet()).json();
    expect(anonymous).toEqual({ available: true, signedIn: false });

    await requestLink('maya@example.com');
    await verifyPost({ token: lastEmailedToken() });
    const raw = 'header-session-raw-token-00001';
    db.sessions.push({
      owner_id: db.owners[0].id,
      token_hash: sha256(raw),
      expires_at: new Date(Date.now() + 60_000),
    });
    cookieValue = raw;
    const signedIn = await (await sessionGet()).json();
    expect(signedIn).toEqual({ available: true, signedIn: true });
    expect(Object.keys(signedIn).sort()).toEqual(['available', 'signedIn']);
  });

  it('logout invalidates the session server-side', async () => {
    const raw = 'header-session-raw-token-00002';
    db.owners.push({ id: randomUUID(), email: 'maya@example.com', name: null });
    db.sessions.push({
      owner_id: db.owners[0].id,
      token_hash: sha256(raw),
      expires_at: new Date(Date.now() + 60_000),
    });
    cookieValue = raw;

    const res = await logoutPost();
    expect(res.status).toBe(200);
    expect(db.sessions).toHaveLength(0);
    const after = await (await sessionGet()).json();
    expect(after).toEqual({ available: true, signedIn: false });
  });
});
