import { useSyncExternalStore } from 'react';
import type { AgentGroup } from './agents';

export interface OwnerInfo {
  name: string;
  email: string;
  phone?: string;
  cityCountry?: string;
  /** ISO timestamp of the onboarding consent checkbox. */
  consentAt: string;
}

export interface PetInfo {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
  /** v2 onboarding fields */
  ageBucket?: string;
  sexNeutered?: string;
  conditions?: string;
  medications?: string;
  vetClinic?: string;
}

export interface PawSession {
  sessionId: string;
  /** Legacy top-level owner name — kept in sync with owner.name for old readers. */
  ownerName: string;
  /** v2: full owner profile. Absent on legacy pet-only sessions. */
  owner?: OwnerInfo;
  pet: PetInfo;
  selectedExperience: string;
  agentGroup: AgentGroup;
  createdAt?: string;
  /**
   * Private durable-record link (the PAWai Care Card), captured from the
   * /api/intake response when persistent storage is live. Absent until the
   * owner saves a summary with the record foundation configured.
   */
  recordUrl?: string;
}

export interface PawDraft {
  ownerName: string;
  ownerEmail: string;
  petName: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
}

const KEY = 'pawai_session';
const DRAFT_KEY = 'pawai_draft';

// Same-tab reactivity: localStorage fires no events for same-tab writes, so
// saveSession/clearSession notify subscribers directly. useSession stays
// hydration-safe (server snapshot is `undefined` = "not yet known").
const sessionListeners = new Set<() => void>();

function emitSession() {
  sessionListeners.forEach((l) => l());
}

// The `storage` event covers writes from OTHER tabs (same-tab writes emit
// directly), so a second tab's gate reacts when this one clears the session.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) emitSession();
  });
}

function subscribeSession(cb: () => void) {
  sessionListeners.add(cb);
  return () => {
    sessionListeners.delete(cb);
  };
}

/**
 * True when onboarding finished: the session carries a full owner profile.
 * Checks shape, not just truthiness — localStorage is user-editable and a
 * malformed session must gate back to /welcome, not crash the dashboard.
 */
export function hasCompleteProfile(
  session: PawSession | null | undefined,
): session is PawSession & { owner: OwnerInfo } {
  return (
    typeof session?.owner?.email === 'string' && session.owner.email.length > 0 &&
    typeof session.owner.name === 'string' &&
    typeof session.pet?.name === 'string' && session.pet.name.length > 0 &&
    typeof session.pet.species === 'string'
  );
}

export function saveSession(session: PawSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
  emitSession();
}

export function loadSession(): PawSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PawSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  emitSession();
}

// The draft helpers predate the 2-step onboarding and are currently unused;
// kept because they are harmless and removal is unrelated cleanup.
export function saveDraft(draft: PawDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): PawDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PawDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed — cache against the raw string and only re-parse when
// it actually changes (avoids React's "getSnapshot should be cached" loop).
let cachedSessionRaw: string | null | undefined = undefined;
let cachedSession: PawSession | null | undefined = undefined;

function getSessionSnapshot(): PawSession | null | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedSessionRaw) return cachedSession;
  cachedSessionRaw = raw;
  try {
    cachedSession = raw ? (JSON.parse(raw) as PawSession) : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

let cachedDraftRaw: string | null | undefined = undefined;
let cachedDraft: PawDraft | null | undefined = undefined;

function getDraftSnapshot(): PawDraft | null | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (raw === cachedDraftRaw) return cachedDraft;
  cachedDraftRaw = raw;
  try {
    cachedDraft = raw ? (JSON.parse(raw) as PawDraft) : null;
  } catch {
    cachedDraft = null;
  }
  return cachedDraft;
}

function noopSubscribe() {
  return () => {};
}

export function useSession(): PawSession | null | undefined {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, () => undefined);
}

export function useDraft(): PawDraft | null | undefined {
  return useSyncExternalStore(noopSubscribe, getDraftSnapshot, () => undefined);
}
