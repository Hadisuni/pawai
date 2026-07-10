import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: "Your Pet's Health Record — PAWai",
  description: "Your pet's health record: guided checks, vet-ready summaries, and entries — stored on your device.",
  robots: { index: false, follow: false },
};

// The dashboard renders entirely from the visitor's own localStorage — the
// server holds no user data and receives no identity. That property (plus
// the client-side session gate in DashboardClient) is what makes an
// auth-less dashboard safe. The old `?oid=&cid=&name=&pet=` query-param
// identity is gone on purpose; legacy email links with those params simply
// land on the gate.
export default function DashboardPage() {
  return <DashboardClient />;
}
