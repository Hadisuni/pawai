import type { Metadata } from 'next';
import WeightSection from './components/WeightSection';
import VaccinationSection from './components/VaccinationSection';
import MedicationSection from './components/MedicationSection';
import QoLSection from './components/QoLSection';

export const metadata: Metadata = {
  title: 'Living Health Record — PAWai',
  description: 'Your pet\'s AI-powered Living Health Record.',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ oid?: string; cid?: string; name?: string; pet?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { oid = '', cid = '', name = 'there', pet = 'your pet' } = await searchParams;
  const firstName = name.split(' ')[0] || 'there';

  const ownerCtx = { oid, cid, ownerName: name, petName: pet };

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
      <div className="wrap" style={{ maxWidth: 640 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <span className="ey" style={{ marginBottom: 12 }}>
            <span className="dot" aria-hidden="true" />
            Living Health Record
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', marginBottom: 8 }}>
            Hi {firstName}! 🐾
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '1rem', lineHeight: 1.7 }}>
            This is <strong style={{ color: 'var(--tx1)' }}>{pet}</strong>&apos;s Living Health Record.
            Every conversation and entry you add builds a richer picture over time.
          </p>
        </div>

        {/* Latest Conversation */}
        <Section icon="📄" title="Latest AI Conversation">
          {cid ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ color: 'var(--tx2)', fontSize: '0.9rem' }}>
                Conversation <code style={{ color: 'var(--teal)', fontSize: '0.82rem' }}>{cid}</code> has been saved.
              </p>
              <p style={{ color: 'var(--tx3)', fontSize: '0.88rem' }}>
                The full summary and recommendations were sent to your email.
              </p>
            </div>
          ) : (
            <EmptyState
              message="No conversations yet."
              cta="Talk to PAWai"
              href="/#ai-assistant"
            />
          )}
        </Section>

        {/* Pet Profile */}
        <Section icon="🐾" title="Pet Profile">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ProfileField label="Name" value={pet} />
            <ProfileField label="Owner" value={name} />
          </div>
          <p style={{ marginTop: 12, fontSize: '0.84rem', color: 'var(--tx3)' }}>
            More pet details (breed, age, species) are collected during your AI conversations.
          </p>
        </Section>

        {/* Weight */}
        <WeightSection ctx={ownerCtx} />

        {/* Vaccinations */}
        <VaccinationSection ctx={ownerCtx} />

        {/* Medications */}
        <MedicationSection ctx={ownerCtx} />

        {/* Quality of Life */}
        <QoLSection ctx={ownerCtx} />

        {/* Talk again */}
        <Section icon="🤖" title="Talk to PAWai Again">
          <p style={{ color: 'var(--tx2)', fontSize: '0.9rem', marginBottom: 16 }}>
            Start a new AI health conversation for {pet}. Each conversation enriches the Living Health Record.
          </p>
          <a href="/#ai-assistant" className="btn btn--pri btn--sm">
            Start a new conversation
          </a>
        </Section>

      </div>
    </main>
  );
}

/* ─── Shared layout helpers ─── */

export function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 20,
        background: 'var(--glass)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '22px 24px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--tx1)',
        }}
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--teal3)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
      }}
    >
      <p style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontWeight: 700, color: 'var(--tx1)', fontSize: '0.95rem' }}>{value || '—'}</p>
    </div>
  );
}

export function EmptyState({ message, cta, href, onClick }: {
  message: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>{message}</p>
      {href ? (
        <a href={href} className="btn btn--ghost btn--sm">{cta}</a>
      ) : (
        <button onClick={onClick} className="btn btn--ghost btn--sm">{cta}</button>
      )}
    </div>
  );
}
