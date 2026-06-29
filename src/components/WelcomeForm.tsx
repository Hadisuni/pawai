'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveDraft } from '@/lib/session';

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

  function handleSubmit(e: FormEvent) {
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
    saveDraft({ ownerName, ownerEmail, petName, species, breed, age, sex, weight });
    router.push('/experiences');
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

      <button type="submit" className="btn btn--pri btn--lg" data-mag style={{ width: '100%', justifyContent: 'center' }}>
        Continue
      </button>

      <p className="welcome-form__note">
        We use this to personalize your experience. No account or password needed.
      </p>
    </form>
  );
}
