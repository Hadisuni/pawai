import { useSyncExternalStore } from 'react';

// The device-local health record: an append-only list of typed entries in
// localStorage. This is deliberately NOT a database — Phase 1 stores the
// record on the visitor's own device only, and every surface that shows it
// says so. Entries render newest-first.

export type RecordEntry =
  | { id: string; type: 'summary'; createdAt: string; concern: string; tier: string; text: string }
  | { id: string; type: 'weight'; createdAt: string; value: string; unit: string; date: string; notes?: string }
  | { id: string; type: 'vaccination'; createdAt: string; vaccine: string; dateGiven: string; nextDue?: string; vetName?: string; notes?: string }
  | { id: string; type: 'medication'; createdAt: string; name: string; dose?: string; frequency?: string; startDate?: string; endDate?: string; notes?: string }
  | { id: string; type: 'qol'; createdAt: string; score: number; date: string; notes?: string }
  | { id: string; type: 'reminder'; createdAt: string; title: string; due: string; done: boolean }
  | { id: string; type: 'note'; createdAt: string; text: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewRecordEntry = DistributiveOmit<RecordEntry, 'id' | 'createdAt'>;

export type RecordWriteResult = { ok: true } | { ok: false; error: string };

const KEY = 'pawai_record_v1';

const ENTRY_TYPES = new Set(['summary', 'weight', 'vaccination', 'medication', 'qol', 'reminder', 'note']);

// localStorage is user-editable and versions drift: drop anything that would
// crash a renderer (unknown type, missing id) instead of trusting the cast.
function sanitize(parsed: unknown): RecordEntry[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (e): e is RecordEntry =>
      !!e && typeof e === 'object' &&
      typeof (e as RecordEntry).id === 'string' &&
      ENTRY_TYPES.has((e as RecordEntry).type),
  );
}

// crypto.randomUUID is missing off secure contexts and on older Safari —
// a record write must never crash over an id.
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

// Same-tab writes notify directly (emit); the `storage` event covers writes
// from OTHER tabs so a second tab doesn't render a stale record forever.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function loadRecord(): RecordEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return sanitize(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function writeRecord(entries: RecordEntry[]): RecordWriteResult {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // QuotaExceededError or storage disabled — never fail silently.
    return { ok: false, error: "This device's storage is full — the entry couldn't be saved." };
  }
  emit();
  return { ok: true };
}

export function addRecordEntry(data: NewRecordEntry): RecordWriteResult {
  if (typeof window === 'undefined') return { ok: false, error: 'Storage is unavailable.' };
  const entry = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
  } as RecordEntry;
  return writeRecord([entry, ...loadRecord()]);
}

export function setReminderDone(id: string, done: boolean): RecordWriteResult {
  const entries = loadRecord().map((e) => (e.id === id && e.type === 'reminder' ? { ...e, done } : e));
  return writeRecord(entries);
}

export function deleteRecordEntry(id: string): RecordWriteResult {
  return writeRecord(loadRecord().filter((e) => e.id !== id));
}

export function clearRecord() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  emit();
}

// Referentially stable snapshot (see session.ts for the pattern rationale).
let cachedRaw: string | null | undefined = undefined;
let cachedEntries: RecordEntry[] | undefined = undefined;

function getSnapshot(): RecordEntry[] | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw && cachedEntries !== undefined) return cachedEntries;
  cachedRaw = raw;
  try {
    cachedEntries = sanitize(raw ? JSON.parse(raw) : []);
  } catch {
    cachedEntries = [];
  }
  return cachedEntries;
}

/** `undefined` = not yet known (SSR / first paint); `[]` = known-empty. */
export function useRecord(): RecordEntry[] | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
