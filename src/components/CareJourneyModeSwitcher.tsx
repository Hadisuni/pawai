'use client';

import { useState } from 'react';
import AICareJourney from './AICareJourney';

// Legacy Max showreel host. /demo now uses DemoCinema; keep this switcher for
// any deep-link or internal reuse of the original AICareJourney demo mode.
// `demo` forces AICareJourney to ignore any local session so a returning owner
// never sees their own pet auto-answered by a script.
export default function CareJourneyModeSwitcher() {
  const [started, setStarted] = useState(false);

  if (started) return <AICareJourney autoStart demo />;

  return (
    <div className="mode-pick" data-r>
      <p className="mode-pick__lead">Ready when you are.</p>
      <div className="mode-pick__btns">
        <button type="button" className="btn btn--pri btn--lg" data-mag onClick={() => setStarted(true)}>
          ▶ Play the demo
        </button>
      </div>
      <p className="mode-pick__note">A self-playing walkthrough of a guided health check — ending in a vet-ready summary.</p>
    </div>
  );
}
