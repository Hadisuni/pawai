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
