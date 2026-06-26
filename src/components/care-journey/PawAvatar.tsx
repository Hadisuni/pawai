'use client';

import Image from 'next/image';

interface PawAvatarProps {
  speaking: boolean;
  listening: boolean;
}

export default function PawAvatar({ speaking, listening }: PawAvatarProps) {
  return (
    <div className={`pa${speaking ? ' pa--talk' : ''}${listening ? ' pa--listen' : ''}`} aria-hidden="true">
      <span className="pa__ring" />
      <Image
        src="/avatar-pawai.jpg"
        alt=""
        width={168}
        height={168}
        className="pa__photo"
        priority
      />
    </div>
  );
}
