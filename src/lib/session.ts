import { useSyncExternalStore } from 'react';
import type { AgentGroup } from './agents';

export interface PetInfo {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
}

export interface PawSession {
  sessionId: string;
  ownerName: string;
  pet: PetInfo;
  selectedExperience: string;
  agentGroup: AgentGroup;
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

export function saveSession(session: PawSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
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
}

// The draft holds owner + pet info collected on /welcome, before an
// experience has been chosen. /experiences turns a draft into a full
// session (with sessionId + selectedExperience + agentGroup) once a tile is picked.
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

// localStorage doesn't fire events for same-tab writes, and these values are
// only ever read once per mount (never updated externally afterward), so the
// subscribe callback is intentionally a no-op — useSyncExternalStore still
// gives us the right thing here: a hydration-safe way to read browser-only
// storage (getServerSnapshot returns `undefined` for "not yet known", since
// localStorage genuinely doesn't exist during SSR) without the extra
// render-pass a manual `useEffect(() => setState(load()))` would cause.
function noopSubscribe() {
  return () => {};
}

// getSnapshot must return a referentially stable value when the underlying
// data hasn't changed — loadSession()/loadDraft() parse JSON on every call,
// so using them directly as getSnapshot returns a new object each render and
// trips React's "getSnapshot should be cached" warning / max update depth
// loop. Cache against the raw string and only re-parse when it actually changes.
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

export function useSession(): PawSession | null | undefined {
  return useSyncExternalStore(noopSubscribe, getSessionSnapshot, () => undefined);
}

export function useDraft(): PawDraft | null | undefined {
  return useSyncExternalStore(noopSubscribe, getDraftSnapshot, () => undefined);
}
