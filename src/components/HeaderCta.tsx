'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearSession, hasCompleteProfile, useSession } from '@/lib/session';

// Session-aware header CTA, two regimes chosen by the server:
//  - Auth not available (no DATABASE_URL — today's live prod): byte-identical
//    legacy behavior, a completed device-local session swaps "Get Started"
//    for "My Dashboard". No sign-in is offered because there is nothing to
//    sign into.
//  - Auth available: /api/auth/session (booleans only, never owner data)
//    decides between "Sign in" and "My Dashboard + Sign out". Until that
//    fetch resolves, the legacy CTA renders — so first paint never flashes
//    a wrong auth state, it just upgrades once known.
type AuthState = { available: boolean; signedIn: boolean };

export default function HeaderCta() {
  const session = useSession();
  const complete = hasCompleteProfile(session);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<AuthState>) : null))
      .then((state) => {
        if (!cancelled && state) setAuth(state);
      })
      .catch(() => {
        // Header quietly stays in legacy mode; nothing to surface.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // The cookie may outlive a failed request; the reload below re-checks.
    }
    // The device-local session is a display cache of the authenticated
    // identity (see DashboardClient seeding) — it goes when the session
    // goes. Device-local record entries are NOT touched: removing them is
    // the dashboard's explicit, confirmed action, not a sign-out side
    // effect. Full navigation (not router.refresh) so every surface —
    // server and client — re-renders signed out.
    clearSession();
    window.location.assign('/');
  }

  if (auth?.available) {
    if (auth.signedIn) {
      return (
        <>
          <Link href="/dashboard" className="btn btn--pri btn--sm" data-mag>
            My Dashboard
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      );
    }
    return (
      <>
        <Link href="/signin" className="btn btn--ghost btn--sm">
          Sign in
        </Link>
        <Link href="/welcome" className="btn btn--pri btn--sm" data-mag>
          Get Started
        </Link>
      </>
    );
  }

  return (
    <Link
      href={complete ? '/dashboard' : '/welcome'}
      className="btn btn--pri btn--sm"
      data-mag
    >
      {complete ? 'My Dashboard' : 'Get Started'}
    </Link>
  );
}
