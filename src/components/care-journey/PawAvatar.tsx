'use client';

interface PawAvatarProps {
  speaking: boolean;
  listening: boolean;
}

export default function PawAvatar({ speaking, listening }: PawAvatarProps) {
  return (
    <div className={`pa${speaking ? ' pa--talk' : ''}${listening ? ' pa--listen' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="pa__svg">
        <defs>
          <linearGradient id="paHead" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a7a60" />
            <stop offset="100%" stopColor="#0d5c47" />
          </linearGradient>
        </defs>

        <g className="pa__body">
          {/* ears */}
          <circle cx="58" cy="46" r="17" fill="url(#paHead)" />
          <circle cx="142" cy="46" r="17" fill="url(#paHead)" />
          <circle cx="58" cy="46" r="8" fill="#0a4536" />
          <circle cx="142" cy="46" r="8" fill="#0a4536" />

          {/* head */}
          <circle cx="100" cy="92" r="68" fill="url(#paHead)" />

          {/* face plate */}
          <ellipse cx="100" cy="100" rx="50" ry="46" fill="#e8f5f0" />

          {/* eyebrows */}
          <path d="M70 78 Q78 72 88 76" stroke="#0a4536" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M130 78 Q122 72 112 76" stroke="#0a4536" strokeWidth="3.2" strokeLinecap="round" fill="none" />

          {/* eyes */}
          <g className="pa__eye" style={{ transformOrigin: '82px 96px' }}>
            <ellipse cx="82" cy="96" rx="7" ry="9" fill="#0a4536" />
            <circle cx="84.5" cy="92.5" r="2" fill="#fff" opacity="0.8" />
          </g>
          <g className="pa__eye" style={{ transformOrigin: '118px 96px' }}>
            <ellipse cx="118" cy="96" rx="7" ry="9" fill="#0a4536" />
            <circle cx="120.5" cy="92.5" r="2" fill="#fff" opacity="0.8" />
          </g>

          {/* cheeks */}
          <ellipse cx="72" cy="114" rx="9" ry="5" fill="#f0915a" opacity="0.18" />
          <ellipse cx="128" cy="114" rx="9" ry="5" fill="#f0915a" opacity="0.18" />

          {/* mouth */}
          <g className="pa__mouth">
            <path className="pa__mouth-idle" d="M88 122 Q100 130 112 122" stroke="#0a4536" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <ellipse className="pa__mouth-talk pa__mouth-talk--a" cx="100" cy="123" rx="9" ry="4" fill="#0a4536" />
            <ellipse className="pa__mouth-talk pa__mouth-talk--b" cx="100" cy="123" rx="6" ry="8" fill="#0a4536" />
          </g>

          {/* collar */}
          <path d="M52 146 Q100 172 148 146 L156 188 L44 188 Z" fill="#1ab38a" />
          <circle cx="100" cy="166" r="11" fill="#0d5c47" />
          <path
            d="M100 161c-2.6 0-4.6 1.6-4.6 3.9 0 1.5 1.2 2.3 2.7 2.3.8 0 1.4-.3 1.9-.3s1.1.3 1.9.3c1.5 0 2.7-.8 2.7-2.3 0-2.3-2-3.9-4.6-3.9Z"
            fill="#2EDCA8"
          />
        </g>
      </svg>
    </div>
  );
}
