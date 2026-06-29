'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/session';
import type { IntakeResponse } from '@/app/api/intake/route';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Other'];
const SEX_OPTIONS = ['Male', 'Female', 'Unknown'];

export default function WelcomeForm() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Unknown');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ownerName.trim() || !petName.trim()) {
      setError('Please fill in your name and your pet’s name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName,
          ownerEmail,
          petName,
          species,
          breed,
          age,
          sex,
          weight,
          // Defaults every first-time /welcome submission to the Health
          // Assessment intake path — selecting a different experience is
          // a secondary action on /experiences, not required up front.
          selectedExperience: 'health',
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data: IntakeResponse = await res.json();
      saveSession({ ...data, agentGroup: 'health' });
      router.push('/demo');
    } catch {
      setError('Something went wrong on our end — please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form className="welcome-form" onSubmit={handleSubmit} aria-label="Owner and pet information">
      <div className="welcome-form__field">
        <label htmlFor="ownerName">Your name</label>
        <input
          id="ownerName"
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Maya Hernandez"
          autoComplete="name"
          required
        />
      </div>

      <div className="welcome-form__field">
        <label htmlFor="ownerEmail">Your email</label>
        <input
          id="ownerEmail"
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="maya@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="welcome-form__row">
        <div className="welcome-form__field">
          <label htmlFor="petName">Pet&apos;s name</label>
          <input
            id="petName"
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Max"
            required
          />
        </div>
        <div className="welcome-form__field">
          <label htmlFor="species">Species</label>
          <select id="species" value={species} onChange={(e) => setSpecies(e.target.value)}>
            {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="welcome-form__row">
        <div className="welcome-form__field">
          <label htmlFor="breed">Breed <span>(optional)</span></label>
          <input id="breed" type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Labrador" />
        </div>
        <div className="welcome-form__field">
          <label htmlFor="age">Age <span>(optional)</span></label>
          <input id="age" type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="6 years" />
        </div>
      </div>

      <div className="welcome-form__row">
        <div className="welcome-form__field">
          <label htmlFor="sex">Sex <span>(optional)</span></label>
          <select id="sex" value={sex} onChange={(e) => setSex(e.target.value)}>
            {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="welcome-form__field">
          <label htmlFor="weight">Weight <span>(optional)</span></label>
          <input id="weight" type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65 lbs" />
        </div>
      </div>

      {error && <p className="welcome-form__error" role="alert">{error}</p>}

      <button
        type="submit"
        className="btn btn--pri btn--lg"
        data-mag
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Getting things ready…' : 'Continue'}
      </button>

      <p className="welcome-form__note">
        We use this to personalize your experience. No account or password needed.
      </p>
    </form>
  );
}
