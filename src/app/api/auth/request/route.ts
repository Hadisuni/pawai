import { NextResponse } from 'next/server';
import { appOrigin } from '@/lib/server/origin';
import { isDbConfigured } from '@/lib/server/db';
import { isEmailConfigured, sendLoginLinkEmail } from '@/lib/server/email';
import { createLoginToken, safeInternalPath } from '@/lib/server/auth';
import { logError, logInfo } from '@/lib/server/log';

// Requests a magic sign-in link. Env-gated by design (same posture as
// /api/intake): with no DB or no email configured this fails loudly instead
// of silently pretending a link was sent. Every response here behaves
// identically for new and existing emails — including the 429 — so this
// endpoint can't be used to probe which emails have a PAWai record.
export async function POST(req: Request) {
  if (!isDbConfigured() || !isEmailConfigured()) {
    return NextResponse.json({ error: 'Sign-in is not configured' }, { status: 503 });
  }

  let body: { email?: unknown; name?: unknown; returnTo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  // Unsafe values silently fall back to the default destination — a
  // crafted sign-in request must not get an error oracle out of this field.
  const returnTo = safeInternalPath(body.returnTo);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }
  if (name && name.length > 100) {
    return NextResponse.json({ error: 'name is too long (max 100 characters)' }, { status: 400 });
  }

  try {
    const created = await createLoginToken(email, name);
    if (created === 'limited') {
      return NextResponse.json(
        { error: 'Too many sign-in links requested. Please wait a few minutes and use the most recent email.' },
        { status: 429 },
      );
    }
    const { rawToken } = created;
    if (process.env.NODE_ENV !== 'production') {
      // Dev-only convenience: there is no test Resend account, so local
      // testing needs a way to see the raw token. Never runs in production
      // (Vercel always sets NODE_ENV=production) and the token is never
      // logged anywhere in the request/response the visitor's browser sees.
      logInfo('api/auth/request', 'dev-only login token issued', { rawToken });
    }
    // The link opens a confirmation page that consumes nothing — email
    // security scanners that prefetch GETs can't burn the one-time token.
    // The actual exchange is the page's form POST to /api/auth/verify.
    const verifyUrl = new URL('/signin/verify', appOrigin());
    verifyUrl.searchParams.set('token', rawToken);
    if (returnTo) verifyUrl.searchParams.set('returnTo', returnTo);
    const sent = await sendLoginLinkEmail({ to: email, verifyUrl: verifyUrl.toString() });
    if (!sent.ok) {
      logError('api/auth/request', 'sendLoginLinkEmail failed', sent.error);
      return NextResponse.json({ error: 'Could not send the sign-in email' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('api/auth/request', 'login token creation failed', err);
    return NextResponse.json({ error: 'Sign-in is unavailable' }, { status: 502 });
  }
}
