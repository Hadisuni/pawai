import { randomBytes } from 'crypto';
import { query } from './db';
import type { NewRecordEntry } from '@/lib/record';

// Durable record storage. Each pet record has one unguessable record_token,
// but the token is a stable private identifier, NOT an access credential:
// every read and write must also prove ownership with the authenticated
// paw_session owner (see getSessionOwner in ./auth). A leaked or forwarded
// record link therefore grants nothing without the owner's session.
//
// Future public sharing must NOT reuse record_token. Sharing needs its own
// expiring, revocable share tokens (separate table, separate /share/...
// route) so a shared link can be revoked without rotating the owner's
// permanent record link. Not built yet — deliberately out of scope.
//
// Callers must gate on isDbConfigured() from ./db.

/** 32 URL-safe chars (~192 bits) — unguessable, safe in a path segment. */
export function newRecordToken(): string {
  return randomBytes(24).toString('base64url');
}

// ---------------------------------------------------------------------------
// Entry validation (server-side mirror of the client RecordEntry union).
// Strips unknown fields so arbitrary junk never lands in the payload column.
// ---------------------------------------------------------------------------

type FieldSpec = { key: string; max: number; required?: boolean };

const ENTRY_FIELDS: Record<NewRecordEntry['type'], FieldSpec[]> = {
  summary: [
    { key: 'concern', max: 120, required: true },
    { key: 'tier', max: 40, required: true },
    { key: 'text', max: 6000, required: true },
  ],
  weight: [
    { key: 'value', max: 20, required: true },
    { key: 'unit', max: 10, required: true },
    { key: 'date', max: 40, required: true },
    { key: 'notes', max: 500 },
  ],
  vaccination: [
    { key: 'vaccine', max: 80, required: true },
    { key: 'dateGiven', max: 40, required: true },
    { key: 'nextDue', max: 40 },
    { key: 'vetName', max: 80 },
    { key: 'notes', max: 500 },
  ],
  medication: [
    { key: 'name', max: 80, required: true },
    { key: 'dose', max: 60 },
    { key: 'frequency', max: 60 },
    { key: 'startDate', max: 40 },
    { key: 'endDate', max: 40 },
    { key: 'notes', max: 500 },
  ],
  qol: [
    { key: 'date', max: 40, required: true },
    { key: 'notes', max: 500 },
  ],
  reminder: [
    { key: 'title', max: 120, required: true },
    { key: 'due', max: 40, required: true },
  ],
  note: [{ key: 'text', max: 2000, required: true }],
};

export type ValidatedEntry = { type: NewRecordEntry['type']; payload: Record<string, unknown> };

/** Returns a stripped, size-capped entry, or a human-readable error string. */
export function validateNewEntry(input: unknown): ValidatedEntry | { error: string } {
  if (!input || typeof input !== 'object') return { error: 'entry must be an object' };
  const raw = input as Record<string, unknown>;
  const type = raw.type;
  if (typeof type !== 'string' || !(type in ENTRY_FIELDS)) {
    return { error: 'entry.type is missing or unknown' };
  }
  const payload: Record<string, unknown> = {};
  for (const { key, max, required } of ENTRY_FIELDS[type as NewRecordEntry['type']]) {
    const value = raw[key];
    if (value === undefined || value === null || value === '') {
      if (required) return { error: `entry.${key} is required for type "${type}"` };
      continue;
    }
    if (typeof value !== 'string') return { error: `entry.${key} must be a string` };
    if (value.length > max) return { error: `entry.${key} is too long (max ${max} characters)` };
    payload[key] = value;
  }
  // Non-string fields of the union, validated by hand.
  if (type === 'qol') {
    const score = raw.score;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 1 || score > 5) {
      return { error: 'entry.score must be a number from 1 to 5' };
    }
    payload.score = score;
  }
  if (type === 'reminder') {
    payload.done = raw.done === true;
  }
  return { type: type as NewRecordEntry['type'], payload };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function upsertOwner(email: string, name?: string): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO owners (email, name)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, owners.name)
     RETURNING id`,
    [email.toLowerCase(), name?.trim() || null],
  );
  return rows[0].id;
}

interface PetInput {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
}

/** Find the owner's pet by name+species (case-insensitive) or create it. */
async function findOrCreatePet(ownerId: string, pet: PetInput): Promise<{ id: string; token: string }> {
  const found = await query<{ id: string; record_token: string }>(
    `SELECT id, record_token FROM pets
     WHERE owner_id = $1 AND lower(name) = lower($2) AND lower(species) = lower($3)
     LIMIT 1`,
    [ownerId, pet.name, pet.species],
  );
  if (found.length > 0) {
    // Fill profile gaps without overwriting anything already stored.
    await query(
      `UPDATE pets SET
         breed = COALESCE(breed, $2),
         age = COALESCE(age, $3),
         sex = COALESCE(sex, $4),
         weight = COALESCE(weight, $5)
       WHERE id = $1`,
      [found[0].id, pet.breed || null, pet.age || null, pet.sex || null, pet.weight || null],
    );
    return { id: found[0].id, token: found[0].record_token };
  }
  const token = newRecordToken();
  const created = await query<{ id: string }>(
    `INSERT INTO pets (owner_id, record_token, name, species, breed, age, sex, weight)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [ownerId, token, pet.name, pet.species, pet.breed || null, pet.age || null, pet.sex || null, pet.weight || null],
  );
  return { id: created[0].id, token };
}

export interface SaveSummaryInput {
  ownerEmail: string;
  ownerName?: string;
  pet: PetInput;
  concern: string;
  summaryText: string;
}

/**
 * The intake write path: upsert owner, find-or-create pet, append the
 * vet-ready summary as a record entry. Returns the pet's private token.
 */
export async function saveSummaryToRecord(input: SaveSummaryInput): Promise<{ recordToken: string; ownerId: string }> {
  const ownerId = await upsertOwner(input.ownerEmail, input.ownerName);
  const { id: petId, token } = await findOrCreatePet(ownerId, input.pet);
  await query(
    `INSERT INTO record_entries (pet_id, type, payload) VALUES ($1, 'summary', $2::jsonb)`,
    [petId, JSON.stringify({ concern: input.concern, tier: 'summary', text: input.summaryText })],
  );
  return { recordToken: token, ownerId };
}

/**
 * Append a validated entry to the record behind `token`, but only when that
 * record belongs to `ownerId`. Null covers both "unknown token" and "someone
 * else's record" — callers must not distinguish the two in responses.
 */
export async function addEntryByToken(
  token: string,
  ownerId: string,
  entry: ValidatedEntry,
): Promise<{ id: string; createdAt: string } | null> {
  if (!isPlausibleToken(token)) return null;
  const pets = await query<{ id: string }>(
    `SELECT id FROM pets WHERE record_token = $1 AND owner_id = $2`,
    [token, ownerId],
  );
  if (pets.length === 0) return null;
  const rows = await query<{ id: string; created_at: string | Date }>(
    `INSERT INTO record_entries (pet_id, type, payload)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id, created_at`,
    [pets[0].id, entry.type, JSON.stringify(entry.payload)],
  );
  return { id: rows[0].id, createdAt: toIso(rows[0].created_at) };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface RecordEntryView {
  id: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface RecordView {
  ownerName: string | null;
  pet: {
    name: string;
    species: string;
    breed: string | null;
    age: string | null;
    sex: string | null;
    weight: string | null;
    conditions: string | null;
    medications: string | null;
    vetClinic: string | null;
  };
  entries: RecordEntryView[];
}

function isPlausibleToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

export interface OwnerPet {
  id: string;
  name: string;
  species: string;
  recordToken: string;
}

/** Most-recently-created first. Used to scope the dashboard to the authenticated owner. */
export async function getPetsByOwnerId(ownerId: string): Promise<OwnerPet[]> {
  const rows = await query<{ id: string; name: string; species: string; record_token: string }>(
    `SELECT id, name, species, record_token FROM pets WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, species: r.species, recordToken: r.record_token }));
}

/** pg returns timestamptz as Date; normalize to an ISO string for views. */
function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * The full record behind `token`, but only when it belongs to `ownerId`.
 * Null covers both "unknown token" and "someone else's record" — callers
 * must not distinguish the two in responses.
 */
export async function getRecordByToken(token: string, ownerId: string): Promise<RecordView | null> {
  if (!isPlausibleToken(token)) return null;
  const pets = await query<{
    id: string;
    name: string;
    species: string;
    breed: string | null;
    age: string | null;
    sex: string | null;
    weight: string | null;
    conditions: string | null;
    medications: string | null;
    vet_clinic: string | null;
    owner_name: string | null;
  }>(
    `SELECT p.id, p.name, p.species, p.breed, p.age, p.sex, p.weight,
            p.conditions, p.medications, p.vet_clinic, o.name AS owner_name
     FROM pets p JOIN owners o ON o.id = p.owner_id
     WHERE p.record_token = $1 AND p.owner_id = $2`,
    [token, ownerId],
  );
  if (pets.length === 0) return null;
  const pet = pets[0];
  const entries = await query<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    created_at: string | Date;
  }>(
    `SELECT id, type, payload, created_at FROM record_entries
     WHERE pet_id = $1
     ORDER BY created_at DESC, id
     LIMIT 500`,
    [pet.id],
  );
  return {
    ownerName: pet.owner_name,
    pet: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      sex: pet.sex,
      weight: pet.weight,
      conditions: pet.conditions,
      medications: pet.medications,
      vetClinic: pet.vet_clinic,
    },
    entries: entries.map((e) => ({
      id: e.id,
      type: e.type,
      createdAt: toIso(e.created_at),
      payload: e.payload ?? {},
    })),
  };
}
