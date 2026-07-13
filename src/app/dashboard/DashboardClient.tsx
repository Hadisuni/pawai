'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AICareJourney from '@/components/AICareJourney';
import SaveRecordCard from '@/components/care-journey/SaveRecordCard';
import { hasCompleteProfile, saveSession, clearSession, useSession } from '@/lib/session';
import { clearRecord, useRecord, type RecordEntry } from '@/lib/record';
import { Section } from './components/Section';
import WeightSection from './components/WeightSection';
import VaccinationSection from './components/VaccinationSection';
import MedicationSection from './components/MedicationSection';
import QoLSection from './components/QoLSection';
import RemindersSection from './components/RemindersSection';
import CareAgentLauncher from './components/CareAgentLauncher';
import CareReadinessMap, { computeReadiness, type ReadinessSignal } from './components/CareReadinessMap';

type View = 'record' | 'check';

function timelineLabel(e: RecordEntry): { icon: string; label: string } {
  switch (e.type) {
    case 'summary': return { icon: '📄', label: `Vet-ready summary — ${e.concern} (${e.tier})` };
    case 'weight': return { icon: '⚖️', label: `Weight: ${e.value} ${e.unit}` };
    case 'vaccination': return { icon: '💉', label: `Vaccination: ${e.vaccine}${e.nextDue ? ` (next due ${e.nextDue})` : ''}` };
    case 'medication': return { icon: '💊', label: `Medication: ${e.name}${e.dose ? ` — ${e.dose}` : ''}${e.frequency ? `, ${e.frequency}` : ''}` };
    case 'qol': return { icon: '❤️', label: `Wellness check-in: ${e.score}/5` };
    case 'note': return { icon: '📝', label: e.text };
    case 'reminder': return { icon: '⏰', label: e.title };
    default: return { icon: '📄', label: 'Record entry' };
  }
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return typeof iso === 'string' ? iso.slice(0, 10) : '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface AuthIdentity {
  owner: { name: string; email: string };
  pet: { name: string; species: string; recordToken: string };
}

export default function DashboardClient({ auth }: { auth?: AuthIdentity } = {}) {
  const router = useRouter();
  const session = useSession();
  const record = useRecord();
  const [view, setView] = useState<View>('record');
  const [editingProfile, setEditingProfile] = useState(false);

  // Whether the localStorage session already matches the authenticated
  // owner's pet (name+species) — the marker that server-side seeding below
  // has landed. localStorage is a seeded display cache here, never the
  // authority: identity/ownership already came from the server.
  const seeded = !!auth && session?.owner?.email === auth.owner.email
    && session?.pet?.name === auth.pet.name && session?.pet?.species === auth.pet.species;

  // Server-authenticated dashboards (DB configured, valid paw_session) seed
  // the local session from the DB-verified owner/pet on every visit, so
  // stale or hand-edited localStorage can never substitute for the real
  // owner. Non-authenticated (no DB configured) dashboards are untouched —
  // same device-local behavior as before this change.
  useEffect(() => {
    if (!auth || seeded) return;
    const base = session && hasCompleteProfile(session) ? session : undefined;
    saveSession({
      sessionId: base?.sessionId ?? crypto.randomUUID(),
      ownerName: auth.owner.name,
      owner: { name: auth.owner.name, email: auth.owner.email, consentAt: base?.owner?.consentAt ?? new Date().toISOString() },
      pet: { ...(base?.pet ?? {}), name: auth.pet.name, species: auth.pet.species },
      selectedExperience: base?.selectedExperience ?? 'health',
      agentGroup: base?.agentGroup ?? 'health',
      // Client-side effect, so the browser's own origin is always the right
      // one — dev links stay dev, prod links stay prod.
      recordUrl: `${window.location.origin}/record/${auth.pet.recordToken}`,
    });
  }, [auth, seeded, session]);

  // Session gate: unauthenticated dashboards require a completed onboarding
  // on this device (legacy pet-only sessions go back to /welcome, prefilled)
  // — authenticated dashboards are already access-controlled server-side by
  // dashboard/page.tsx, so no client-side redirect applies here.
  const gated = !auth && (session === null || (session !== undefined && !hasCompleteProfile(session)));
  useEffect(() => {
    if (gated) router.replace('/welcome');
  }, [gated, router]);

  // Written as one guard (rather than a precomputed boolean) so TypeScript's
  // control-flow narrowing on hasCompleteProfile's type predicate still
  // applies to `session` below.
  if (session === undefined || !hasCompleteProfile(session) || (auth && !seeded)) {
    // Not yet known (first paint), seeding in flight, or redirecting.
    return <main style={{ minHeight: '60vh' }} />;
  }

  const pet = session.pet;
  const owner = session.owner;
  const recordUrl = session.recordUrl;
  const firstName = owner.name.split(' ')[0] || 'there';
  const entries = record ?? [];
  const latestSummary = entries.find((e): e is Extract<RecordEntry, { type: 'summary' }> => e.type === 'summary');
  const timelineEntries = entries.filter((e) => e.type !== 'reminder');
  const readiness = computeReadiness(pet, entries);
  const missingPrompts = readiness.signals.filter((s) => s.prompt !== null);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleNavigate(target: 'profile' | 'summary' | 'timeline') {
    setView('record');
    const id = target === 'profile' ? 'pet-profile-section' : target === 'summary' ? 'vet-summary-section' : 'health-timeline-section';
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  // Map/prompt navigation: readiness targets are a superset of the Care
  // Agent's nav targets (reminders, wellness, and the check flow itself).
  function handleReadinessSelect(target: ReadinessSignal['target']) {
    if (target === 'check') {
      setView('check');
      return;
    }
    const ids: Record<Exclude<ReadinessSignal['target'], 'check'>, string> = {
      profile: 'pet-profile-section',
      summary: 'vet-summary-section',
      timeline: 'health-timeline-section',
      reminders: 'reminders-section',
      wellness: 'wellness-section',
    };
    document.getElementById(ids[target])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Clears localStorage only — it never deletes anything saved to the durable
  // Care Card record, and the confirm text must say so whenever one exists.
  function handleClearDevice() {
    const sure = window.confirm(
      recordUrl
        ? `Remove ${pet.name}'s record and profile from this device? Everything saved to ${pet.name}'s Care Card stays stored with PAWai — this only clears this device.`
        : `Remove ${pet.name}'s record and profile from this device? There's no other copy yet, so this can't be undone.`,
    );
    if (!sure) return;
    clearRecord();
    clearSession();
    router.replace('/');
  }

  const careAgent = (
    <CareAgentLauncher
      pet={pet}
      entries={entries}
      latestSummary={latestSummary}
      onStartHealthCheck={() => setView('check')}
      onNavigate={handleNavigate}
    />
  );

  if (view === 'check') {
    return (
      <>
        <main style={{ minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}>
          <div className="wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setView('record')}>
                ← Back to {pet.name}&apos;s record
              </button>
              <p style={{ color: 'var(--tx3)', fontSize: '0.85rem' }}>
                The summary saves to {pet.name}&apos;s record on this device automatically.
              </p>
            </div>
            <AICareJourney autoStart />
          </div>
        </main>
        {careAgent}
      </>
    );
  }

  return (
    <>
    <main style={{ minHeight: '100vh', paddingTop: 60, paddingBottom: 80 }}>
      <div className="wrap" style={{ maxWidth: 1080 }}>

        {/* Header: the record is the noun — the pet's story, not a clinic screen */}
        <div style={{ marginBottom: 28 }}>
          <span className="ey" style={{ marginBottom: 12 }}>
            <span className="dot" aria-hidden="true" />
            Hi {firstName} 🐾
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', marginBottom: 8 }}>
            {pet.name}&apos;s living record
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '1rem', lineHeight: 1.7 }}>
            Every entry builds <strong style={{ color: 'var(--tx1)' }}>{pet.name}</strong>&apos;s
            story in one calm place. More details make PAWai more useful.
          </p>
        </div>

        {/* Persistence honesty banner */}
        <p
          style={{
            fontSize: '0.82rem', color: 'var(--tx3)', lineHeight: 1.6,
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            padding: '10px 14px', marginBottom: 24, background: 'rgba(var(--teal-rgb), 0.04)',
          }}
        >
          {recordUrl ? (
            <>
              Day-to-day entries stay on this device; saved summaries also live on{' '}
              <strong style={{ color: 'var(--tx2)' }}>{pet.name}&apos;s private Care Card link</strong>.
              Clearing browser data removes only the on-device part.
            </>
          ) : (
            <>
              {pet.name}&apos;s record is stored <strong style={{ color: 'var(--tx2)' }}>on this device only</strong>{' '}—
              there&apos;s no account or sync yet, and clearing browser data may remove it.
              Email yourself a copy of any summary to keep it.
            </>
          )}
        </p>

        {/* Upper band: profile sidebar + care readiness map */}
        <div className="dash-grid">
          <aside>
            {/* Pet profile */}
            <Section id="pet-profile-section" icon="🐾" title="Pet Profile">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ProfileField label="Name" value={pet.name} />
                <ProfileField label="Species" value={pet.species} />
                <ProfileField label="Age" value={pet.ageBucket || pet.age || '—'} />
                <ProfileField label="Sex" value={pet.sexNeutered || pet.sex || '—'} />
                {pet.breed && <ProfileField label="Breed" value={pet.breed} />}
                {pet.weight && <ProfileField label="Weight" value={pet.weight} />}
                {pet.conditions && <ProfileField label="Conditions" value={pet.conditions} />}
                {pet.medications && <ProfileField label="Medications" value={pet.medications} />}
                {pet.vetClinic && <ProfileField label="Vet clinic" value={pet.vetClinic} />}
              </div>
              {editingProfile ? (
                <ProfileDetailsForm
                  initial={pet}
                  onCancel={() => setEditingProfile(false)}
                  onSave={(details) => {
                    saveSession({ ...session, pet: { ...pet, ...details } });
                    setEditingProfile(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: 14 }}
                  onClick={() => setEditingProfile(true)}
                >
                  + Add details
                </button>
              )}
            </Section>

            {/* PAWai Care Card — the private durable-record entry point */}
            <Section icon="🪪" title="PAWai Care Card">
              {recordUrl ? (
                <>
                  <p style={{ color: 'var(--tx2)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
                    {pet.name}&apos;s private record page — open it from any device
                    by signing in with your email.
                  </p>
                  <a
                    className="btn btn--pri btn--sm"
                    href={recordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open PAWai Care Card
                  </a>
                  <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', lineHeight: 1.6, marginTop: 10 }}>
                    The Care Card contains owner-entered information. It&apos;s private
                    to you — opening it asks for your PAWai sign-in first.
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--tx3)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Save a summary to create a private care record — email yourself a
                  vet-ready summary and your Care Card link arrives with it.
                </p>
              )}
            </Section>

            {/* Missing information prompts */}
            {missingPrompts.length > 0 && (
              <Section icon="✨" title="Information strength">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {missingPrompts.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleReadinessSelect(s.target)}
                      style={{
                        textAlign: 'left', fontFamily: 'var(--font-b)', fontSize: '0.85rem',
                        color: 'var(--tx2)', lineHeight: 1.5, cursor: 'pointer',
                        background: 'rgba(var(--teal-rgb), 0.05)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)', padding: '9px 12px',
                      }}
                    >
                      <span aria-hidden="true" style={{ marginRight: 6 }}>{s.icon}</span>
                      {s.prompt}
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </aside>

          <div>
            {/* Balanced record actions — the record is the center; the health
                check is one door among several, not the headline */}
            <Section icon="➕" title="Add an update">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollTo('weight-section')}>
                  ⚖️ Add weight
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollTo('vaccination-section')}>
                  💉 Add vaccine
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollTo('medication-section')}>
                  💊 Add medication
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollTo('wellness-section')}>
                  ❤️ Start wellness check-in
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollTo('vet-summary-section')}>
                  📄 Prepare Vet-Ready Summary
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setView('check')}>
                  🩺 Check a health concern
                </button>
              </div>
            </Section>

            {/* Care readiness map */}
            <Section icon="🧭" title="Care readiness">
              <CareReadinessMap pet={pet} readiness={readiness} onSelect={handleReadinessSelect} />
              {readiness.recentConcern && (
                <p style={{ fontSize: '0.85rem', color: 'var(--tx3)', textAlign: 'center', marginTop: 10 }}>
                  Recent concern: {readiness.recentConcern.concern} · {formatDay(readiness.recentConcern.createdAt)}
                </p>
              )}
              {latestSummary && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleReadinessSelect('summary')}>
                    View Vet-Ready Summary
                  </button>
                </div>
              )}
            </Section>

            {/* Health concern — visible, but one quiet door, not the centerpiece */}
            <Section icon="🩺" title="Health concern?">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <p style={{ color: 'var(--tx2)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 380 }}>
                  Worried about something? Structured questions, about 3 minutes,
                  ending in a vet-ready summary.
                </p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setView('check')}>
                  Start health concern check
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--tx3)', marginTop: 10 }}>
                PAWai does not diagnose or replace a veterinarian.
              </p>
            </Section>
          </div>
        </div>

        {/* Lower band: summary, timeline, and entry sections */}
        <div className="dash-lower">
          {/* Vet-ready summary */}
          <Section id="vet-summary-section" icon="📄" title="Vet-Ready Summary">
            {latestSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--tx3)' }}>
                  {latestSummary.concern} · {latestSummary.tier} · {formatDay(latestSummary.createdAt)}
                </p>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap', fontFamily: 'var(--font-b)', fontSize: '0.88rem',
                    color: 'var(--tx2)', lineHeight: 1.65, background: 'rgba(var(--bg-rgb), 0.5)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '14px 16px',
                    margin: 0, maxHeight: 260, overflowY: 'auto',
                  }}
                >
                  {latestSummary.text}
                </pre>
                <SaveRecordCard pet={pet} concern={latestSummary.concern} summaryText={latestSummary.text} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>
                  Your first health check ends in a vet-ready summary. It will live here.
                </p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setView('check')}>
                  Start Health Check
                </button>
              </div>
            )}
          </Section>

          {/* Health timeline */}
          <Section id="health-timeline-section" icon="📈" title="Health Timeline">
            {timelineEntries.length === 0 ? (
              <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>
                Every check and entry you add builds {pet.name}&apos;s story here.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {timelineEntries.map((e) => {
                  const { icon, label } = timelineLabel(e);
                  return (
                    <li key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: '0.9rem' }}>
                      <span aria-hidden="true">{icon}</span>
                      <span style={{ color: 'var(--tx2)', flex: 1 }}>{label}</span>
                      <span style={{ color: 'var(--tx3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDay(e.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Entry sections (write + read-back); wrapper ids are the "Add an
              update" scroll targets — the components themselves are unchanged */}
          <div id="weight-section">
            <WeightSection />
          </div>
          <div id="vaccination-section">
            <VaccinationSection />
          </div>
          <div id="medication-section">
            <MedicationSection />
          </div>
          <div id="reminders-section">
            <RemindersSection />
          </div>
          <div id="wellness-section">
            <QoLSection petName={pet.name} />
          </div>
        </div>

        {/* Clear this device */}
        <p style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            type="button"
            onClick={handleClearDevice}
            style={{
              background: 'none', border: 'none', color: 'var(--tx3)',
              fontSize: '0.82rem', textDecoration: 'underline', cursor: 'pointer',
              fontFamily: 'var(--font-b)',
            }}
          >
            Remove {pet.name}&apos;s record from this device
          </button>
        </p>
      </div>
    </main>
    {careAgent}
    </>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--teal3)', borderRadius: 'var(--r-sm)', padding: '10px 14px' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontWeight: 700, color: 'var(--tx1)', fontSize: '0.95rem' }}>{value || '—'}</p>
    </div>
  );
}

interface ProfileDetails {
  breed?: string;
  weight?: string;
  conditions?: string;
  medications?: string;
  vetClinic?: string;
}

function ProfileDetailsForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileDetails;
  onSave: (d: ProfileDetails) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Required<ProfileDetails>>({
    breed: initial.breed ?? '',
    weight: initial.weight ?? '',
    conditions: initial.conditions ?? '',
    medications: initial.medications ?? '',
    vetClinic: initial.vetClinic ?? '',
  });

  const fields: Array<{ key: keyof ProfileDetails; label: string; placeholder: string }> = [
    { key: 'breed', label: 'Breed', placeholder: 'e.g. Labrador' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g. 24 kg' },
    { key: 'conditions', label: 'Existing conditions', placeholder: 'e.g. hip dysplasia' },
    { key: 'medications', label: 'Current medications', placeholder: 'e.g. Apoquel 5mg daily' },
    { key: 'vetClinic', label: 'Vet clinic', placeholder: 'e.g. Main St Animal Hospital' },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          breed: form.breed.trim() || undefined,
          weight: form.weight.trim() || undefined,
          conditions: form.conditions.trim() || undefined,
          medications: form.medications.trim() || undefined,
          vetClinic: form.vetClinic.trim() || undefined,
        });
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}
    >
      {fields.map(({ key, label, placeholder }) => (
        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label} (optional)
          </span>
          <input
            type="text"
            value={form[key]}
            placeholder={placeholder}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        </label>
      ))}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn--pri btn--sm">Save details</button>
        <button type="button" onClick={onCancel} className="btn btn--ghost btn--sm">Cancel</button>
      </div>
    </form>
  );
}
