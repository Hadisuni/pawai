'use client';

import { createElement } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID;

// PAWai Guide — the public level of PAWai: a corner widget on public pages
// that answers general questions and invites profile creation. It receives
// ZERO user data by design (spec §6.3): personalization exists only inside
// the dashboard's Care Agent, which mounts its own widget with pet context.
// Hidden on /dashboard so the two levels never render side by side.
// Built with createElement (not JSX) since <elevenlabs-convai> is a custom
// element with no IntrinsicElements typing in @types/react.
export default function SupportWidget() {
  const pathname = usePathname();
  if (!AGENT_ID) return null;
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <>
      {createElement('elevenlabs-convai', { 'agent-id': AGENT_ID })}
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" async />
    </>
  );
}
