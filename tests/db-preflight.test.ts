import { afterAll, describe, expect, it } from 'vitest';
import { closePool, isDbConfigured, query } from '@/lib/server/db';
import {
  addEntryByToken,
  getPetsByOwnerId,
  getRecordByToken,
  saveSummaryToRecord,
  upsertOwner,
  validateNewEntry,
} from '@/lib/server/recordStore';
import { consumeLoginToken, createLoginToken, deleteSession, getOwnerBySessionToken } from '@/lib/server/auth';

// Preflight against a REAL Postgres. Every other test file mocks
// @/lib/server/db, which means SCHEMA_SQL and the actual SQL in
// recordStore/auth are never executed anywhere in CI — the first request
// after DATABASE_URL is set in production would otherwise be the first time
// that SQL has ever run.
//
// Run once against a fresh database before turning storage on:
//   DATABASE_URL='postgres://...' npm run test
//
// Skipped entirely when DATABASE_URL is unset, so normal runs are unaffected.
// Writes only under two throwaway @preflight.invalid owners and deletes them
// afterwards (ON DELETE CASCADE clears pets, entries, tokens and sessions).

const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const OWNER_EMAIL = `preflight-${stamp}@preflight.invalid`;
const OTHER_EMAIL = `preflight-other-${stamp}@preflight.invalid`;

describe.skipIf(!process.env.DATABASE_URL)('database preflight (real Postgres)', () => {
  afterAll(async () => {
    if (!isDbConfigured()) return;
    // Owners cascade to pets -> record_entries, plus login_tokens and sessions.
    await query(`DELETE FROM owners WHERE email IN ($1, $2)`, [OWNER_EMAIL, OTHER_EMAIL]);
    await closePool();
  });

  it('self-provisions the schema on first use', async () => {
    // Any query triggers ensureSchema(); this asserts the real DDL applied.
    const rows = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('owners','pets','record_entries','login_tokens','sessions')
       ORDER BY table_name`,
    );
    expect(rows.map((r) => r.table_name)).toEqual([
      'login_tokens',
      'owners',
      'pets',
      'record_entries',
      'sessions',
    ]);
  });

  it('runs on a Postgres new enough for gen_random_uuid() without pgcrypto', async () => {
    const rows = await query<{ num: string }>(`SHOW server_version_num`);
    // gen_random_uuid() is built in from PostgreSQL 13; the schema relies on
    // it as a column DEFAULT and would fail at insert time on anything older.
    expect(Number(rows[0].num)).toBeGreaterThanOrEqual(130000);
    const uuid = await query<{ id: string }>(`SELECT gen_random_uuid() AS id`);
    expect(uuid[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('writes a summary and reads it back for its owner', async () => {
    const { recordToken, ownerId } = await saveSummaryToRecord({
      ownerEmail: OWNER_EMAIL,
      ownerName: 'Preflight Owner',
      pet: { name: 'Preflight Pet', species: 'Dog', breed: 'Mixed' },
      concern: 'Preflight check',
      summaryText: 'Round-trip verification of the durable record path.',
    });

    const view = await getRecordByToken(recordToken, ownerId);
    expect(view).not.toBeNull();
    expect(view!.pet.name).toBe('Preflight Pet');
    expect(view!.entries).toHaveLength(1);
    expect(view!.entries[0].type).toBe('summary');
    expect(view!.entries[0].payload.text).toContain('Round-trip verification');

    const pets = await getPetsByOwnerId(ownerId);
    expect(pets.map((p) => p.recordToken)).toContain(recordToken);
  });

  it('refuses reads and writes from a different owner holding a valid token', async () => {
    const { recordToken, ownerId } = await saveSummaryToRecord({
      ownerEmail: OWNER_EMAIL,
      ownerName: 'Preflight Owner',
      pet: { name: 'Preflight Pet', species: 'Dog' },
      concern: 'Ownership check',
      summaryText: 'Second entry on the same pet.',
    });
    const intruderId = await upsertOwner(OTHER_EMAIL, 'Preflight Intruder');
    expect(intruderId).not.toBe(ownerId);

    // A leaked record link must grant nothing without the owner's session.
    expect(await getRecordByToken(recordToken, intruderId)).toBeNull();

    const entry = validateNewEntry({ type: 'weight', value: '9.1', unit: 'kg', date: '2026-09-02' });
    expect('error' in entry).toBe(false);

    expect(await addEntryByToken(recordToken, intruderId, entry as never)).toBeNull();

    const saved = await addEntryByToken(recordToken, ownerId, entry as never);
    expect(saved).not.toBeNull();

    const view = await getRecordByToken(recordToken, ownerId);
    expect(view!.entries.some((e) => e.type === 'weight')).toBe(true);
  });

  it('spends a magic-link token exactly once and mints a working session', async () => {
    const issued = await createLoginToken(OWNER_EMAIL, 'Preflight Owner');
    expect(issued).not.toBe('limited');
    const { rawToken } = issued as Exclude<typeof issued, 'limited'>;

    const session = await consumeLoginToken(rawToken);
    expect(session).not.toBeNull();

    // Reuse of a spent login token must fail.
    expect(await consumeLoginToken(rawToken)).toBeNull();

    const owner = await getOwnerBySessionToken(session!.rawToken);
    expect(owner?.email).toBe(OWNER_EMAIL);

    await deleteSession(session!.rawToken);
    expect(await getOwnerBySessionToken(session!.rawToken)).toBeNull();
  });
});
