'use client';

import Link from 'next/link';
import { hasCompleteProfile, useSession } from '@/lib/session';

// Session-aware header CTA. There is NO login for MVP (nothing to log into
// while records are device-local): a completed local session simply swaps
// "Get Started" for "My Dashboard". Server-render + first client paint show
// "Get Started" (session unknown), then useSyncExternalStore re-renders.
export default function HeaderCta() {
  const session = useSession();
  const complete = hasCompleteProfile(session);

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
