'use client';

import { useEffect, useState } from 'react';
import AICareJourney from './AICareJourney';
import LiveVoiceJourney from './LiveVoiceJourney';
import { loadSession } from '@/lib/session';

export default function CareJourneyModeSwitcher() {
  const [mode, setMode] = useState<'voice' | 'text' | null>(null);
  // The scripted text fallback is Health-Assessment-specific content (vomiting,
  // limping, etc.) — only offer it when there's no session yet, or the chosen
  // experience actually is Health Assessment. Other agents have no scripted
  // equivalent, so voice (the real agent) is the only option for them.
  const [showTextOption, setShowTextOption] = useState(true);

  useEffect(() => {
    const session = loadSession();
    setShowTextOption(!session || session.agentGroup === 'health');
  }, []);

  if (mode === 'voice') return <LiveVoiceJourney />;
  if (mode === 'text') return <AICareJourney autoStart />;

  return (
    <div className="mode-pick" data-r>
      <p className="mode-pick__lead">How would you like to try it?</p>
      <div className="mode-pick__btns">
        <button type="button" className="btn btn--pri btn--lg" data-mag onClick={() => setMode('voice')}>
          🎙 Start Voice Conversation
        </button>
        {showTextOption && (
          <button type="button" className="btn btn--ghost btn--lg" data-mag onClick={() => setMode('text')}>
            💬 Start Text Conversation
          </button>
        )}
      </div>
      <p className="mode-pick__note">Voice uses your microphone for a real spoken conversation with PAWai.</p>
    </div>
  );
}
