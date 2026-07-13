import { NextResponse } from 'next/server';
import { consumeLoginToken, safeInternalPath, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/server/auth';
import { isDbConfigured } from '@/lib/server/db';

// Redeems a magic-link token. POST-only, deliberately: the emailed link
// itself is a GET to /signin/verify (a page that mutates nothing), so
// email security scanners that prefetch links can't consume the one-time
// token — only the page's form submission lands here. Claiming is atomic
// and single-use (a second POST with the same token gets nothing to
// claim); missing/expired/already-used all collapse to the same generic
// /signin errors so this can't become a token-state oracle. All redirects
// are 303 so the browser follows with a GET, never a replayed POST.
export async function POST(req: Request) {
  const url = new URL(req.url);

  let token: string | null = null;
  let returnTo: string | null = null;
  try {
    const form = await req.formData();
    const rawToken = form.get('token');
    token = typeof rawToken === 'string' ? rawToken : null;
    returnTo = safeInternalPath(form.get('returnTo'));
  } catch {
    // Not a form post — fall through to the generic invalid redirect.
  }

  if (!isDbConfigured() || !token) {
    return NextResponse.redirect(new URL('/signin?error=invalid', url), 303);
  }

  const session = await consumeLoginToken(token);
  if (!session) {
    return NextResponse.redirect(new URL('/signin?error=expired', url), 303);
  }

  const res = NextResponse.redirect(new URL(returnTo ?? '/dashboard', url), 303);
  res.cookies.set(SESSION_COOKIE, session.rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
