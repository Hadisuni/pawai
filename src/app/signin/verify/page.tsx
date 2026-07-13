import type { Metadata } from 'next';
import Link from 'next/link';
import { isPlausibleToken, safeInternalPath } from '@/lib/server/auth';

// The magic-link landing page. Rendering it touches no state and reads no
// database — an email security scanner that prefetches the link sees only
// this page and cannot spend the one-time token. The real exchange is the
// form POST to /api/auth/verify, which requires an intentional click.
// Token validity is deliberately NOT checked here: a pre-flight validity
// lookup would hand token state to anyone (or any scanner) holding the
// URL. A stale token simply comes back from the POST as the generic
// expired/invalid message on /signin.
export const metadata: Metadata = {
  title: 'Confirm sign-in — PAWai',
  robots: { index: false, follow: false },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' && isPlausibleToken(params.token) ? params.token : null;
  const returnTo = safeInternalPath(params.returnTo);

  return (
    <section className="hero" aria-labelledby="verify-h1">
      <div className="wrap" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Sign in</span>
        </div>
        <h1 id="verify-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          {token ? 'One click to go.' : 'This link isn’t right.'}
        </h1>
        {token ? (
          <>
            <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
              Confirm it&apos;s you and we&apos;ll open your pet&apos;s record.
            </p>
            <form method="POST" action="/api/auth/verify" data-r data-d="3">
              <input type="hidden" name="token" value={token} />
              {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
              <button type="submit" className="btn btn--pri btn--lg" data-mag>
                Continue to sign in
              </button>
            </form>
            <p data-r data-d="4" style={{ color: 'var(--tx3)', fontSize: '0.85rem', marginTop: 18, lineHeight: 1.6 }}>
              Didn&apos;t request this sign-in? You can safely close this page —
              nothing happens until the button is pressed.
            </p>
          </>
        ) : (
          <>
            <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
              This sign-in link is incomplete or malformed. Request a fresh one —
              it only takes a moment.
            </p>
            <div data-r data-d="3">
              <Link href="/signin" className="btn btn--pri btn--lg" data-mag>
                Request a new link
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
