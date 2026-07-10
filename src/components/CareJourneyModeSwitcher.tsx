'use client';

import { useState } from 'react';
import AICareJourney from './AICareJourney';

// /demo hosts the public showreel only: `demo` forces AICareJourney to
// ignore any local session, so a returning owner watching the demo sees the
// default pet auto-play — never their own pet impersonated by a script. The
// real guided health check lives inside /dashboard.
// (Voice mode / LiveVoiceJourney stays disabled; the site's corner widget is
// the single public ElevenLabs agent — see SupportWidget.)
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
