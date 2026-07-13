import { NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/server/db';
import { getSessionOwner } from '@/lib/server/auth';

// Header auth state. Booleans only, on purpose: the header needs to know
// whether sign-in exists (DB configured) and whether this browser is
// signed in — never who the owner is. Queried client-side so the root
// layout stays static instead of turning every page dynamic with a
// cookies() call.
export async function GET() {
  const noStore = { headers: { 'Cache-Control': 'no-store' } };
  if (!isDbConfigured()) {
    return NextResponse.json({ available: false, signedIn: false }, noStore);
  }
  const owner = await getSessionOwner();
  return NextResponse.json({ available: true, signedIn: Boolean(owner) }, noStore);
}
