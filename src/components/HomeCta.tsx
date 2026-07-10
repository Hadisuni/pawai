'use client';

import Link from 'next/link';
import { hasCompleteProfile, useSession } from '@/lib/session';

// Session-aware primary CTA for the homepage (hero + bottom CTA card).
// Same pattern as DemoCta/HeaderCta: a visitor without a profile is invited
// to create one; an owner with a record on this device opens their dashboard
// instead — "Create your pet's free profile" must never sit next to
// "My Dashboard" while quietly leading to the same place.
export default function HomeCta() {
  const session = useSession();
  const complete = hasCompleteProfile(session);

  if (complete) {
    return (
      <Link href="/dashboard" className="btn btn--pri btn--lg" data-mag>
        Open {session.pet.name}&apos;s dashboard
      </Link>
    );
  }
  return (
    <Link href="/welcome" className="btn btn--pri btn--lg" data-mag>
      Create your pet&apos;s free profile
    </Link>
  );
}
