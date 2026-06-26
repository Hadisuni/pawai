'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDraft, saveSession, clearDraft } from '@/lib/session';
import { isAgentLive, type AgentGroup } from '@/lib/agents';
import type { IntakeResponse } from '@/app/api/intake/route';

interface ExperienceTile {
  id: string;
  icon: string;
  title: string;
  description: string;
  group: AgentGroup;
}

// All tiles route to /demo — the same call shell loads whichever agent
// matches the chosen group. A tile is only clickable once its group's
// NEXT_PUBLIC_ELEVENLABS_*_AGENT_ID env var is actually configured.
const EXPERIENCES: ExperienceTile[] = [
  { id: 'health', icon: '🩺', title: 'Health Assessment', description: 'A live adaptive intake call that prepares a vet-ready summary.', group: 'health' },
  { id: 'behavior', icon: '🐕‍🦺', title: 'Behavior & Training', description: 'Guidance for everyday behavior questions and training plans.', group: 'behavior' },
  { id: 'newpet', icon: '🏡', title: 'New Pet Guide', description: 'Everything to know in the first weeks with a new pet.', group: 'newPet' },
  { id: 'nutrition', icon: '🍽️', title: 'Nutrition', description: 'Diet guidance tailored to your pet’s age and breed.', group: 'newPet' },
  { id: 'wellness', icon: '📈', title: 'Wellness', description: 'Ongoing health tracking, reminders, and trends over time.', group: 'newPet' },
];

export default function ExperiencePicker() {
  const router = useRouter();
  const draft = useDraft();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(exp: ExperienceTile) {
    if (!draft || pendingId) return;
    setPendingId(exp.id);
    setError(null);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, selectedExperience: exp.id }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data: IntakeResponse = await res.json();
      saveSession({ ...data, agentGroup: exp.group });
      clearDraft();
      router.push('/demo');
    } catch {
      setError('Something went wrong on our end — please try again.');
      setPendingId(null);
    }
  }

  if (draft === null) {
    return (
      <div className="welcome-form" style={{ textAlign: 'center' }}>
        <p className="hero__lead" style={{ margin: '0 auto 24px' }}>
          We don&apos;t have your details yet — let&apos;s start there.
        </p>
        <Link href="/welcome" className="btn btn--pri btn--lg" data-mag style={{ justifyContent: 'center' }}>
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div>
      {draft && (
        <p className="hero__lead" data-r style={{ margin: '0 auto 36px', textAlign: 'center' }}>
          Welcome, {draft.ownerName.split(' ')[0]}! What would you like help with for {draft.petName} today?
        </p>
      )}

      {error && <p className="welcome-form__error" role="alert" style={{ textAlign: 'center' }}>{error}</p>}

      <div className="exp-grid">
        {EXPERIENCES.map((exp, i) =>
          isAgentLive(exp.group) ? (
            <button
              key={exp.id}
              type="button"
              className="exp-tile"
              data-tilt
              data-r
              data-d={String(Math.min(i, 5))}
              onClick={() => handlePick(exp)}
              disabled={pendingId !== null}
              aria-busy={pendingId === exp.id}
            >
              <div className="exp-tile__ic" aria-hidden="true">{exp.icon}</div>
              <h3>{exp.title}</h3>
              <p>{pendingId === exp.id ? 'Getting things ready…' : exp.description}</p>
            </button>
          ) : (
            <div key={exp.id} className="exp-tile is-soon" data-r data-d={String(Math.min(i, 5))}>
              <div className="exp-tile__ic" aria-hidden="true">{exp.icon}</div>
              <h3>{exp.title}</h3>
              <p>{exp.description}</p>
              <span className="exp-tile__badge">Coming soon</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
