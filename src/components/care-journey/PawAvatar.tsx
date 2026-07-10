'use client';

import PawLogo from '../PawLogo';

interface PawAvatarProps {
  speaking: boolean;
  listening: boolean;
}

// Brand presence for the guided conversation: the PAWai paw mark in a calm
// circle. Deliberately not a human face — this is an AI-guided flow, and the
// visual must never imply a live person is on a call.
export default function PawAvatar({ speaking, listening }: PawAvatarProps) {
  return (
    <div className={`pa${speaking ? ' pa--talk' : ''}${listening ? ' pa--listen' : ''}`} aria-hidden="true">
      <span className="pa__ring" />
      <div className="pa__photo pa__logo">
        <PawLogo size={84} />
      </div>
    </div>
  );
}
