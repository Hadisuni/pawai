import { loadSession } from '@/lib/session';
import type { NewRecordEntry } from '@/lib/record';

// Mirrors an entry to the durable record (/api/record) after it has already
// been saved to the device-local record. Local-first by design: callers only
// invoke this AFTER a successful local save, and a failure here must never
// block or undo anything — the entry is safe on the device either way.

export type CareCardSyncResult =
  /** Written to the durable record (or an identical write just happened). */
  | 'synced'
  /** No Care Card yet (no recordUrl on the session) — nothing to do. */
  | 'no-card'
  /** The durable write failed; the entry remains on this device only. */
  | 'failed';

function tokenFromRecordUrl(recordUrl: string): string | null {
  try {
    const match = new URL(recordUrl).pathname.match(/\/record\/([A-Za-z0-9_-]{16,64})\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Repeated identical submissions (double-click, double form submit) must not
// create duplicate durable entries. Signatures are registered BEFORE the
// request fires so a second click while the first is in flight is also
// caught; on failure the signature is released so a retry can succeed.
const recentSignatures = new Map<string, number>();
const DEDUPE_WINDOW_MS = 10_000;

function pruneSignatures(now: number) {
  for (const [sig, at] of recentSignatures) {
    if (now - at >= DEDUPE_WINDOW_MS) recentSignatures.delete(sig);
  }
}

export async function syncEntryToCareCard(entry: NewRecordEntry): Promise<CareCardSyncResult> {
  const recordUrl = loadSession()?.recordUrl;
  if (!recordUrl) return 'no-card';
  const token = tokenFromRecordUrl(recordUrl);
  if (!token) return 'no-card';

  const signature = JSON.stringify(entry);
  const now = Date.now();
  pruneSignatures(now);
  const last = recentSignatures.get(signature);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return 'synced';
  recentSignatures.set(signature, now);

  try {
    const res = await fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, entry }),
    });
    if (!res.ok) {
      recentSignatures.delete(signature);
      return 'failed';
    }
    return 'synced';
  } catch {
    recentSignatures.delete(signature);
    return 'failed';
  }
}
