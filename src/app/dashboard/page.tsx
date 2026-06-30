import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Your Conversation — PAWai',
  description: 'Your AI conversation with PAWai has been saved. A summary has been sent to your email.',
  alternates: { canonical: '/dashboard' },
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <section className="hero" aria-labelledby="dashboard-h1">
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 16px',
        }}
      >
        {/* Check icon */}
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(52,199,123,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34c77b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          id="dashboard-h1"
          style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: 12 }}
        >
          Thank you
        </h1>

        <p
          className="hero__lead"
          style={{ margin: '0 auto 32px', maxWidth: 360 }}
        >
          Your AI conversation has been saved.
          <br />
          A summary has been sent to your email.
        </p>

        {/* Status list */}
        <ul
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 32,
            textAlign: 'left',
          }}
        >
          {[
            { color: '#34c77b', text: 'Your AI conversation has been saved' },
            { color: '#3b9cf0', text: 'View your latest summary in your inbox' },
            { color: '#e0944a', text: 'More features are coming soon', badge: 'SOON' },
          ].map(({ color, text, badge }) => (
            <li
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                padding: '13px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-2)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              {text}
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                    background: `${color}1a`,
                    borderRadius: 20,
                    padding: '2px 8px',
                    marginLeft: 4,
                    letterSpacing: '0.06em',
                  }}
                >
                  {badge}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/#ai-assistant"
            className="btn btn--primary"
            style={{ textAlign: 'center' }}
          >
            Continue chatting with PAWai
          </Link>
          <Link
            href="/"
            className="btn btn--ghost"
            style={{ textAlign: 'center' }}
          >
            Back to PAWai
          </Link>
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: 'var(--text-3)',
            lineHeight: 1.6,
          }}
        >
          AI-generated guidance only — not a veterinary diagnosis.
        </p>
      </div>
    </section>
  );
}
