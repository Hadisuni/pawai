import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { isDbConfigured } from '@/lib/server/db';
import { getOwnerBySessionToken, SESSION_COOKIE } from '@/lib/server/auth';
import { getPetsByOwnerId } from '@/lib/server/recordStore';

export const metadata: Metadata = {
  title: "Your Pet's Health Record — PAWai",
  description: "Your pet's health record: guided checks, vet-ready summaries, and entries — stored on your device.",
  robots: { index: false, follow: false },
};

// Two modes, chosen once per request:
//  - DATABASE_URL unset: unchanged from before this file existed — renders
//    entirely from the visitor's own localStorage, server holds no identity.
//    This is the currently-live production behavior and must keep working
//    even though DB-backed auth exists in code, until Hadi provisions it.
//  - DATABASE_URL set: paw_session is the single source of truth. No valid
//    session -> /signin. No pet yet for this owner -> /welcome. Otherwise
//    the DB-verified owner+pet (never client-supplied) is handed to
//    DashboardClient, which seeds it into localStorage as a display cache —
//    see the `seeded` effect there for why that's not a parallel auth path.
export default async function DashboardPage() {
  if (!isDbConfigured()) {
    return <DashboardClient />;
  }

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const owner = token ? await getOwnerBySessionToken(token) : null;
  if (!owner) {
    redirect('/signin');
  }

  const pets = await getPetsByOwnerId(owner.ownerId);
  if (pets.length === 0) {
    redirect('/welcome');
  }

  const pet = pets[0];
  return (
    <DashboardClient
      auth={{
        owner: { name: owner.name ?? '', email: owner.email },
        pet: { name: pet.name, species: pet.species, recordToken: pet.recordToken },
      }}
    />
  );
}
