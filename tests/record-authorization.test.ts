import { createHash, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Authorization tests for the private record surfaces: POST /api/record and
// the ownership-scoped reads behind /record/[token]. The real Postgres layer
// is replaced with an in-memory fake that emulates exactly the statements
// auth.ts and recordStore.ts issue — including their WHERE clauses — so
// these tests prove the owner-scoping SQL and the route's session gate
// without a database. Any statement the fake doesn't recognize throws, so a
// query change here fails loudly instead of passing vacuously.

interface OwnerRow { id: string; email: string; name: string | null }
interface PetRow {
  id: string; owner_id: string; record_token: string; name: string; species: string;
  breed: string | null; age: string | null; sex: string | null; weight: string | null;
  conditions: string | null; medications: string | null; vet_clinic: string | null;
}
interface SessionRow { owner_id: string; token_hash: string; expires_at: Date }
interface EntryRow { id: string; pet_id: string; type: string; payload: Record<string, unknown>; created_at: Date }

const db = {
  owners: [] as OwnerRow[],
  pets: [] as PetRow[],
  sessions: [] as SessionRow[],
  record_entries: [] as EntryRow[],
};

function fakeQuery(text: string, params: ReadonlyArray<string | null> = []): Record<string, unknown>[] {
  const sql = text.replace(/\s+/g, ' ').trim();

  if (sql.includes('FROM sessions s JOIN owners o')) {
    // getOwnerBySessionToken: token_hash match + not expired.
    return db.sessions
      .filter((s) => s.token_hash === params[0] && s.expires_at.getTime() > Date.now())
      .map((s) => {
        const owner = db.owners.find((o) => o.id === s.owner_id)!;
        return { owner_id: owner.id, email: owner.email, name: owner.name };
      });
  }

  if (sql.includes('SELECT id FROM pets WHERE record_token = $1 AND owner_id = $2')) {
    // addEntryByToken ownership check: BOTH the token and the owner must match.
    return db.pets
      .filter((p) => p.record_token === params[0] && p.owner_id === params[1])
      .map((p) => ({ id: p.id }));
  }

  if (sql.includes('INSERT INTO record_entries')) {
    const row: EntryRow = {
      id: randomUUID(),
      pet_id: params[0] as string,
      type: params[1] as string,
      payload: JSON.parse(params[2] as string),
      created_at: new Date(),
    };
    db.record_entries.push(row);
    return [{ id: row.id, created_at: row.created_at }];
  }

  if (sql.includes('FROM pets p JOIN owners o') && sql.includes('p.record_token = $1 AND p.owner_id = $2')) {
    // getRecordByToken pet lookup, owner-scoped.
    return db.pets
      .filter((p) => p.record_token === params[0] && p.owner_id === params[1])
      .map((p) => {
        const owner = db.owners.find((o) => o.id === p.owner_id)!;
        return {
          id: p.id, name: p.name, species: p.species, breed: p.breed, age: p.age,
          sex: p.sex, weight: p.weight, conditions: p.conditions,
          medications: p.medications, vet_clinic: p.vet_clinic, owner_name: owner.name,
        };
      });
  }

  if (sql.includes('SELECT id, type, payload, created_at FROM record_entries')) {
    return db.record_entries
      .filter((e) => e.pet_id === params[0])
      .map((e) => ({ id: e.id, type: e.type, payload: e.payload, created_at: e.created_at }));
  }

  throw new Error(`fake db has no handler for: ${sql}`);
}

vi.mock('@/lib/server/db', () => ({
  isDbConfigured: () => true,
  query: async (text: string, params?: ReadonlyArray<string | null>) => fakeQuery(text, params),
}));

// getSessionOwner reads the paw_session cookie via next/headers; tests set
// `cookieValue` to simulate the browser's cookie jar.
let cookieValue: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'paw_session' && cookieValue !== undefined ? { name, value: cookieValue } : undefined,
  }),
}));

import { POST } from '@/app/api/record/route';
import { getRecordByToken } from '@/lib/server/recordStore';

const sha256 = (raw: string) => createHash('sha256').update(raw).digest('hex');

// Raw tokens must satisfy isPlausibleToken (/^[A-Za-z0-9_-]{16,64}$/).
const OWNER_A_SESSION = 'owner-a-session-token-000000001';
const OWNER_B_SESSION = 'owner-b-session-token-000000001';
const EXPIRED_SESSION = 'owner-a-expired-token-000000001';
const PET_A_TOKEN = 'record-token-pet-a-000000000001';

let ownerAId: string;
let ownerBId: string;

function seed() {
  db.owners = [];
  db.pets = [];
  db.sessions = [];
  db.record_entries = [];

  ownerAId = randomUUID();
  ownerBId = randomUUID();
  db.owners.push(
    { id: ownerAId, email: 'owner-a@example.com', name: 'Owner A' },
    { id: ownerBId, email: 'owner-b@example.com', name: 'Owner B' },
  );
  db.pets.push({
    id: randomUUID(), owner_id: ownerAId, record_token: PET_A_TOKEN,
    name: 'Rex', species: 'Dog', breed: null, age: null, sex: null, weight: null,
    conditions: null, medications: null, vet_clinic: null,
  });
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  db.sessions.push(
    { owner_id: ownerAId, token_hash: sha256(OWNER_A_SESSION), expires_at: inThirtyDays },
    { owner_id: ownerBId, token_hash: sha256(OWNER_B_SESSION), expires_at: inThirtyDays },
    { owner_id: ownerAId, token_hash: sha256(EXPIRED_SESSION), expires_at: new Date(Date.now() - 1000) },
  );
}

function postRecord(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/record', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

const validEntry = { type: 'note', text: 'Ate well today' };

beforeEach(() => {
  seed();
  cookieValue = undefined;
});

describe('record reads (ownership behind /record/[token])', () => {
  it('returns the record to its authenticated owner', async () => {
    const record = await getRecordByToken(PET_A_TOKEN, ownerAId);
    expect(record).not.toBeNull();
    expect(record!.pet.name).toBe('Rex');
  });

  it('returns null to a different authenticated owner, even with a valid token', async () => {
    const record = await getRecordByToken(PET_A_TOKEN, ownerBId);
    expect(record).toBeNull();
  });

  it('returns null for an unknown or malformed token — same shape as not-owned', async () => {
    expect(await getRecordByToken('record-token-does-not-exist-0001', ownerAId)).toBeNull();
    expect(await getRecordByToken('short', ownerAId)).toBeNull();
    expect(await getRecordByToken('!!not-a-token!!', ownerAId)).toBeNull();
  });
});

describe('POST /api/record (ownership-gated writes)', () => {
  it('lets the authenticated owner append to their own record', async () => {
    cookieValue = OWNER_A_SESSION;
    const res = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(db.record_entries).toHaveLength(1);
    expect(db.record_entries[0].pet_id).toBe(db.pets[0].id);
  });

  it('rejects an unauthenticated request with 401 and writes nothing', async () => {
    const res = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(res.status).toBe(401);
    expect(db.record_entries).toHaveLength(0);
  });

  it('rejects a different authenticated owner with 404 and writes nothing', async () => {
    cookieValue = OWNER_B_SESSION;
    const res = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(res.status).toBe(404);
    expect(db.record_entries).toHaveLength(0);
  });

  it('does not let a leaked record token bypass ownership', async () => {
    // No session at all: the valid token alone gets 401.
    const anon = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(anon.status).toBe(401);

    // A made-up session cookie value gets 401 too.
    cookieValue = 'forged-session-token-0000000001';
    const forged = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(forged.status).toBe(401);

    expect(db.record_entries).toHaveLength(0);
  });

  it('does not reveal whether a record exists: unknown token and not-owned token respond identically', async () => {
    cookieValue = OWNER_B_SESSION;
    const notOwned = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    const unknown = await postRecord({ token: 'record-token-does-not-exist-0001', entry: validEntry });
    expect(notOwned.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(await notOwned.json()).toEqual(await unknown.json());
  });

  it('returns a safe response for invalid tokens', async () => {
    cookieValue = OWNER_A_SESSION;
    const malformed = await postRecord({ token: '!!not-a-token!!', entry: validEntry });
    expect(malformed.status).toBe(404);
    const missing = await postRecord({ entry: validEntry });
    expect(missing.status).toBe(400);
    expect(db.record_entries).toHaveLength(0);
  });

  it('rejects an expired session with 401 and writes nothing', async () => {
    cookieValue = EXPIRED_SESSION;
    const res = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(res.status).toBe(401);
    expect(db.record_entries).toHaveLength(0);
  });

  it('rejects a logged-out (deleted) session with 401', async () => {
    // Logout deletes the session row; the cookie value the browser still
    // holds must stop working immediately.
    db.sessions = db.sessions.filter((s) => s.token_hash !== sha256(OWNER_A_SESSION));
    cookieValue = OWNER_A_SESSION;
    const res = await postRecord({ token: PET_A_TOKEN, entry: validEntry });
    expect(res.status).toBe(401);
    expect(db.record_entries).toHaveLength(0);
  });
});
