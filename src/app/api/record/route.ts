import { NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/server/db';
import { getSessionOwner } from '@/lib/server/auth';
import { addEntryByToken, validateNewEntry } from '@/lib/server/recordStore';

// Append an entry to a durable record. Requires the owner's authenticated
// session: the record token only names the record, the paw_session cookie
// proves who is writing, and the write goes through only when the two match.
// Owner identity is never taken from the request body. Unknown tokens and
// other owners' tokens both get the same 404, so this endpoint can't be
// used to probe which records exist.
export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Record storage is not configured' }, { status: 503 });
  }

  const owner = await getSessionOwner();
  if (!owner) {
    return NextResponse.json({ error: 'Sign in to update this record' }, { status: 401 });
  }

  let body: { token?: unknown; entry?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = body.token;
  if (typeof token !== 'string' || token.length === 0) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const validated = validateNewEntry(body.entry);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const saved = await addEntryByToken(token, owner.ownerId, validated);
    if (!saved) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt });
  } catch (err) {
    console.error('[api/record] write failed:', err);
    return NextResponse.json({ error: 'Record storage is unavailable' }, { status: 502 });
  }
}
