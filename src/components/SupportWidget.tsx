'use client';

import { createElement } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID;

// General customer-support widget, separate from the pet-specific AI Care
// Journey agents. Hidden on /demo: that's the one page where a Care Journey
// voice agent can be actively live, and two agents must never run at once.
// Built with createElement (not JSX) since <elevenlabs-convai> is a custom
// element with no IntrinsicElements typing in @types/react.
export default function SupportWidget() {
  const pathname = usePathname();
  if (!AGENT_ID || pathname?.startsWith('/demo')) return null;

  return (
    <>
      {createElement('elevenlabs-convai', { 'agent-id': AGENT_ID })}
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" async />
    </>
  );
}
