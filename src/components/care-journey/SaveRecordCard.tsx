'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { loadSession, type PetInfo } from '@/lib/session';

interface SaveRecordCardProps {
  pet: PetInfo;
  concern: string;
  summaryText: string;
}

// Email a copy of the vet-ready summary. The summary itself is already saved
// to the device-local record before this card is used — the email is the
// take-it-with-you copy. Reuses the existing /api/intake → n8n pipeline; the
// summary text travels in the `message` field so the confirmation email the
// visitor receives contains their actual summary.
export default function SaveRecordCard({ pet, concern, summaryText }: SaveRecordCardProps) {
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'invalid' | 'failed'>('idle');

  // Don't ask for what onboarding already collected: prefill from the local
  // session (post-mount to stay hydration-safe; fields remain editable).
  useEffect(() => {
    const owner = loadSession()?.owner;
    if (!owner) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail((v) => v || owner.email);
    setOwnerName((v) => v || owner.name);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('invalid');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: ownerName.trim() || 'Pet Parent',
          ownerEmail: email.trim(),
          petName: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.ageBucket || pet.age,
          sex: pet.sexNeutered || pet.sex,
          weight: pet.weight,
          selectedExperience: 'health',
          concern,
          message: summaryText,
        }),
      });
      setStatus(res.ok ? 'sent' : 'failed');
    } catch {
      setStatus('failed');
    }
  }

  if (status === 'sent') {
    return (
      <div className="vsummary" style={{ textAlign: 'center' }}>
        <div className="vsummary__hd">📬 On its way!</div>
        <p style={{ fontSize: '0.92rem', color: 'var(--tx2)', lineHeight: 1.65 }}>
          Check your inbox — {pet.name}&apos;s vet-ready summary has been emailed to you,
          so it&apos;s there whenever the appointment comes.
        </p>
      </div>
    );
  }

  return (
    <form className="vsummary" onSubmit={handleSubmit} aria-label="Email this summary">
      <div className="vsummary__hd">💌 Email me a copy</div>
      <p style={{ fontSize: '0.9rem', color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 14 }}>
        Get {pet.name}&apos;s vet-ready summary in your inbox — ready to bring to the clinic.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Your name (optional)"
          autoComplete="name"
          aria-label="Your name (optional)"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-label="Your email"
          required
        />
        <button type="submit" className="btn btn--pri btn--sm" disabled={status === 'sending'} data-mag>
          {status === 'sending' ? 'Sending…' : `Email me ${pet.name}'s summary`}
        </button>
        {status === 'invalid' && (
          <p className="welcome-form__error" role="alert" style={{ margin: 0 }}>
            That email address doesn&apos;t look right — please check it and try again.
          </p>
        )}
        {status === 'failed' && (
          <p className="welcome-form__error" role="alert" style={{ margin: 0 }}>
            Our email service is having trouble right now — {pet.name}&apos;s summary is still
            saved on this device. Please try again in a bit.
          </p>
        )}
      </div>
      <p className="vsummary__disclaimer">
        We only use your email to send this summary — sending shares it with our
        email service. No spam, ever.
      </p>
    </form>
  );
}
