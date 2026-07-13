import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { isDbConfigured } from '@/lib/server/db';
import { getSessionOwner } from '@/lib/server/auth';
import { getRecordByToken, type RecordEntryView } from '@/lib/server/recordStore';
import CareCardActions from './CareCardActions';

// The PAWai Care Card: the owner's private record page. Opening it requires
// the owner's authenticated session AND the matching record token — the
// token alone (leaked, forwarded, logged) grants nothing. This is NOT a
// sharing surface: handing the record to a vet/sitter happens via Print /
// Save-as-PDF for now, and future link-sharing must use separate expiring,
// revocable share tokens under a dedicated /share/... route (see
// lib/server/recordStore.ts). Never indexed, cached, or statically built.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PAWai Care Card',
  robots: { index: false, follow: false },
};

function str(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  return typeof v === 'string' ? v : '';
}

// Server-side sibling of the dashboard's timelineLabel — kept separate so the
// dashboard files stay untouched.
function entryLabel(e: RecordEntryView): { icon: string; label: string } {
  const p = e.payload;
  switch (e.type) {
    case 'summary':
      return { icon: '📄', label: `Vet-ready summary — ${str(p, 'concern') || 'health check'}` };
    case 'weight':
      return { icon: '⚖️', label: `Weight: ${str(p, 'value')} ${str(p, 'unit')}`.trim() };
    case 'vaccination':
      return {
        icon: '💉',
        label: `Vaccination: ${str(p, 'vaccine')}${str(p, 'nextDue') ? ` (next due ${str(p, 'nextDue')})` : ''}`,
      };
    case 'medication':
      return {
        icon: '💊',
        label: `Medication: ${str(p, 'name')}${str(p, 'dose') ? ` — ${str(p, 'dose')}` : ''}${str(p, 'frequency') ? `, ${str(p, 'frequency')}` : ''}`,
      };
    case 'qol':
      return { icon: '❤️', label: `Wellness check-in${typeof p.score === 'number' ? `: ${p.score}/5` : ''}` };
    case 'reminder':
      return { icon: '⏰', label: `Reminder: ${str(p, 'title')}` };
    case 'note':
      return { icon: '📝', label: str(p, 'text') || 'Note' };
    default:
      return { icon: '📄', label: 'Record entry' };
  }
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main style={{ minHeight: '60vh', paddingTop: 80, paddingBottom: 80 }}>
      <div className="wrap" style={{ maxWidth: 560, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>{title}</h1>
        <p style={{ color: 'var(--tx2)', lineHeight: 1.7 }}>{body}</p>
      </div>
    </main>
  );
}

const cardSection: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  padding: '18px 20px',
  marginBottom: 20,
};

function Card({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section style={cardSection}>
      <h2 style={{ fontSize: '1.05rem', marginBottom: 14 }}>
        <span aria-hidden="true">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--teal3)', borderRadius: 'var(--r-sm)', padding: '10px 14px' }}>
      <p style={{ fontSize: '0.72rem', color: 'var(--tx3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontWeight: 700, color: 'var(--tx1)', fontSize: '0.92rem' }}>{value}</p>
    </div>
  );
}

function EssentialRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.92rem', lineHeight: 1.6 }}>
      <span aria-hidden="true">{icon}</span>
      <span style={{ color: 'var(--tx3)', minWidth: 168 }}>{label}</span>
      <span style={{ color: 'var(--tx1)', fontWeight: 600, flex: 1 }}>{value}</span>
    </div>
  );
}

export default async function RecordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isDbConfigured()) {
    return (
      <Notice
        title="Records aren't available yet"
        body="Saved records are coming online soon. Anything you've saved on your own device is still there — open PAWai on that device to see it."
      />
    );
  }

  // Same gate as /dashboard: no valid session, no record page. returnTo
  // brings the owner straight back here after the magic-link round trip.
  const owner = await getSessionOwner();
  if (!owner) {
    redirect(`/signin?returnTo=${encodeURIComponent(`/record/${token}`)}`);
  }

  let record;
  try {
    record = await getRecordByToken(token, owner.ownerId);
  } catch (err) {
    console.error('[record/[token]] read failed:', err);
    return (
      <Notice
        title="We couldn't open this record right now"
        body="Something went wrong on our side — please try again in a few minutes. Nothing about the record has changed."
      />
    );
  }

  if (!record) notFound();

  const { pet, entries } = record;
  const latestSummary = entries.find((e) => e.type === 'summary');
  const vaccinations = entries.filter((e) => e.type === 'vaccination');
  const medications = entries.filter((e) => e.type === 'medication');
  const notes = entries.filter((e) => e.type === 'note');

  const identityChips: Array<[string, string | null]> = [
    ['Species', pet.species],
    ['Breed', pet.breed],
    ['Age', pet.age],
    ['Sex', pet.sex],
    ['Weight', pet.weight],
  ];

  const hasEssentials = Boolean(pet.conditions || pet.vetClinic);
  const hasMedications = medications.length > 0 || Boolean(pet.medications);

  return (
    <main style={{ minHeight: '100vh', paddingTop: 60, paddingBottom: 80 }}>
      <div id="care-card" className="wrap" style={{ maxWidth: 760 }}>
        {/* Header */}
        <span className="ey" style={{ marginBottom: 12 }}>
          <span className="dot" aria-hidden="true" />
          Private care record
        </span>
        <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', marginBottom: 8 }}>PAWai Care Card</h1>
        <p style={{ color: 'var(--tx2)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 8 }}>
          A simple care record for anyone helping with {pet.name}.
        </p>
        <p style={{ color: 'var(--tx3)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 18 }}>
          This Care Card contains owner-entered information. PAWai does not diagnose
          or replace a veterinarian.
        </p>
        <CareCardActions />
        <p className="print-only" style={{ fontSize: '0.78rem', color: 'var(--tx3)', margin: '0 0 18px' }}>
          Printed from PAWai (pawai.it.com) · Owner-entered information — not a medical document.
        </p>

        {/* Pet identity */}
        <section style={cardSection}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>
            <span aria-hidden="true">🐾</span> {pet.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {identityChips
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <Chip key={label} label={label} value={value as string} />
              ))}
          </div>
        </section>

        {/* Care essentials — only what the owner has filled in */}
        {hasEssentials && (
          <Card icon="⭐" title="Care essentials">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pet.conditions && <EssentialRow icon="⚠️" label="Conditions & allergies" value={pet.conditions} />}
              {pet.vetClinic && <EssentialRow icon="🏥" label="Primary clinic" value={pet.vetClinic} />}
            </div>
          </Card>
        )}

        {/* Medications: profile free-text + logged entries */}
        {hasMedications && (
          <Card icon="💊" title="Medications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pet.medications && (
                <EssentialRow icon="💊" label="Current (owner-listed)" value={pet.medications} />
              )}
              {medications.map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  <span aria-hidden="true">💊</span>
                  <span style={{ color: 'var(--tx1)', fontWeight: 600, flex: 1 }}>
                    {str(m.payload, 'name')}
                    {str(m.payload, 'dose') && ` — ${str(m.payload, 'dose')}`}
                    {str(m.payload, 'frequency') && `, ${str(m.payload, 'frequency')}`}
                    {str(m.payload, 'notes') && (
                      <span style={{ color: 'var(--tx3)', fontWeight: 400 }}> · {str(m.payload, 'notes')}</span>
                    )}
                  </span>
                  <span style={{ color: 'var(--tx3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {str(m.payload, 'startDate') || formatDay(m.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Vaccinations */}
        {vaccinations.length > 0 && (
          <Card icon="💉" title="Vaccinations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vaccinations.map((v) => (
                <div key={v.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.92rem', lineHeight: 1.6, flexWrap: 'wrap' }}>
                  <span aria-hidden="true">💉</span>
                  <span style={{ color: 'var(--tx1)', fontWeight: 600 }}>{str(v.payload, 'vaccine')}</span>
                  <span style={{ color: 'var(--tx2)' }}>given {str(v.payload, 'dateGiven') || formatDay(v.createdAt)}</span>
                  {str(v.payload, 'nextDue') && (
                    <span style={{ color: 'var(--tx2)' }}>· next due {str(v.payload, 'nextDue')}</span>
                  )}
                  {str(v.payload, 'vetName') && (
                    <span style={{ color: 'var(--tx3)' }}>· {str(v.payload, 'vetName')}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Latest vet-ready summary, in full */}
        {latestSummary && (
          <Card icon="📄" title="Latest vet-ready summary">
            <p style={{ fontSize: '0.82rem', color: 'var(--tx3)', marginBottom: 12 }}>
              {str(latestSummary.payload, 'concern')} · {formatDay(latestSummary.createdAt)}
            </p>
            <pre
              style={{
                whiteSpace: 'pre-wrap', fontFamily: 'var(--font-b)', fontSize: '0.88rem',
                color: 'var(--tx2)', lineHeight: 1.65, border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', padding: '14px 16px', margin: 0,
              }}
            >
              {str(latestSummary.payload, 'text')}
            </pre>
          </Card>
        )}

        {/* Owner & behavior notes */}
        {notes.length > 0 && (
          <Card icon="📝" title="Owner & behavior notes">
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0 }}>
              {notes.map((n) => (
                <li key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <span aria-hidden="true">📝</span>
                  <span style={{ color: 'var(--tx2)', flex: 1 }}>{str(n.payload, 'text')}</span>
                  <span style={{ color: 'var(--tx3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDay(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Timeline */}
        <Card icon="📈" title="Timeline">
          {entries.length === 0 ? (
            <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>
              Nothing saved yet — entries appear here the moment they&apos;re saved.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0 }}>
              {entries.map((e) => {
                const { icon, label } = entryLabel(e);
                return (
                  <li key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.9rem' }}>
                    <span aria-hidden="true">{icon}</span>
                    <span style={{ color: 'var(--tx2)', flex: 1 }}>{label}</span>
                    <span style={{ color: 'var(--tx3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDay(e.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <p style={{ fontSize: '0.82rem', color: 'var(--tx3)', lineHeight: 1.6 }}>
          PAWai does not diagnose or treat — your veterinary team makes the medical decisions.
          If your pet is in visible distress, contact a veterinary clinic right away.
        </p>
      </div>
    </main>
  );
}
