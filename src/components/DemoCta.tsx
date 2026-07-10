'use client';

import Link from 'next/link';
import { hasCompleteProfile, useSession } from '@/lib/session';

// Session-aware CTA for /demo: visitors without a profile are invited to
// create one; owners with a record on this device go back to it instead of
// being looped through onboarding again (the old circular-CTA problem).
export default function DemoCta() {
  const session = useSession();
  const complete = hasCompleteProfile(session);

  if (complete) {
    return (
      <Link href="/dashboard" className="btn btn--pri btn--lg" data-mag>
        Open {session.pet.name}&apos;s record
      </Link>
    );
  }
  return (
    <Link href="/welcome" className="btn btn--pri btn--lg" data-mag>
      Create your pet&apos;s free profile
    </Link>
  );
}
