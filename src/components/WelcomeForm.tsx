'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { hasCompleteProfile, loadSession, saveSession } from '@/lib/session';
import { clearRecord, uid } from '@/lib/record';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Other'];
const AGE_OPTIONS = ['Under 1 year', '1–3 years', '4–7 years', '8–12 years', '13+ years', 'Not sure'];
const SEX_OPTIONS = ['Male', 'Male, neutered', 'Female', 'Female, spayed', 'Not sure'];

// Two-step onboarding: the pet first, then the owner. Deliberately small —
// 6 required fields total. Everything else (conditions, medications, vet
// clinic, today's concern) is collected progressively inside the dashboard.
// No server call happens here; the profile lives on this device until the
// visitor explicitly emails themselves something.
export default function WelcomeForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — the pet
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [ageBucket, setAgeBucket] = useState('');
  const [sexNeutered, setSexNeutered] = useState('');
  const [weight, setWeight] = useState('');

  // Step 2 — the owner
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cityCountry, setCityCountry] = useState('');
  const [consent, setConsent] = useState(false);

  // A completed profile already has a dashboard — re-running onboarding would
  // silently overwrite the profile while the record persists (old entries
  // would show under a new pet's name). Start over = "Clear this device" on
  // the dashboard, which wipes both together.
  // A legacy pet-only session (from the previous 2-field welcome) prefills
  // step 1 so returning visitors don't retype what they already told us.
  useEffect(() => {
    const s = loadSession();
    if (hasCompleteProfile(s)) {
      router.replace('/dashboard');
      return;
    }
    if (s && !s.owner?.email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPetName((v) => v || s.pet.name);
      setSpecies((v) => (v !== 'Dog' ? v : s.pet.species || 'Dog'));
      if (s.pet.breed) setBreed((v) => v || s.pet.breed!);
      if (s.pet.weight) setWeight((v) => v || s.pet.weight!);
    }
  }, [router]);

  function handleStep1(e: FormEvent) {
    e.preventDefault();
    if (!petName.trim()) {
      setError('Please tell us your pet’s name.');
      return;
    }
    if (!ageBucket) {
      setError('Please pick an age range — “Not sure” is fine.');
      return;
    }
    if (!sexNeutered) {
      setError('Please pick an option — “Not sure” is fine.');
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleStep2(e: FormEvent) {
    e.preventDefault();
    if (!ownerName.trim()) {
      setError('Please tell us your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('That email address doesn’t look right — please check it.');
      return;
    }
    if (!consent) {
      setError('Please confirm the checkbox so we can save the record on this device.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    // A brand-new profile must never inherit another pet's entries: any
    // record left on this device (orphaned by a cleared/partial session)
    // is wiped together with creating the profile.
    clearRecord();
    saveSession({
      sessionId: uid(),
      ownerName: ownerName.trim(),
      owner: {
        name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        cityCountry: cityCountry.trim() || undefined,
        consentAt: new Date().toISOString(),
      },
      pet: {
        name: petName.trim(),
        species,
        breed: breed.trim() || undefined,
        ageBucket,
        sexNeutered,
        weight: weight.trim() || undefined,
      },
      selectedExperience: 'health',
      agentGroup: 'health',
      createdAt: new Date().toISOString(),
    });
    router.push('/dashboard');
  }

  return (
    <form
      className="welcome-form"
      onSubmit={step === 1 ? handleStep1 : handleStep2}
      aria-label={step === 1 ? 'Your pet’s information' : 'Your information'}
    >
      <p className="welcome-form__step" aria-live="polite">
        Step {step} of 2 · {step === 1 ? 'Your pet' : `Who’s looking after ${petName.trim() || 'your pet'}?`}
      </p>

      {step === 1 ? (
        <>
          <div className="welcome-form__row">
            <div className="welcome-form__field">
              <label htmlFor="petName">Pet&apos;s name</label>
              <input
                id="petName"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Max"
                autoFocus
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
              <label htmlFor="ageBucket">Age</label>
              <select id="ageBucket" value={ageBucket} onChange={(e) => setAgeBucket(e.target.value)} required>
                <option value="" disabled>Select…</option>
                {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="welcome-form__field">
              <label htmlFor="sexNeutered">Sex</label>
              <select id="sexNeutered" value={sexNeutered} onChange={(e) => setSexNeutered(e.target.value)} required>
                <option value="" disabled>Select…</option>
                {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="welcome-form__row">
            <div className="welcome-form__field">
              <label htmlFor="breed">Breed <span>(optional)</span></label>
              <input id="breed" type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Labrador" />
            </div>
            <div className="welcome-form__field">
              <label htmlFor="weight">Weight <span>(optional)</span></label>
              <input id="weight" type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 24 kg" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="welcome-form__field">
            <label htmlFor="ownerName">Your name</label>
            <input
              id="ownerName"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Alex"
              autoFocus
              required
              autoComplete="name"
            />
          </div>
          <div className="welcome-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <details className="welcome-form__more">
            <summary>Add phone or location (optional)</summary>
            <div className="welcome-form__row" style={{ marginTop: 12 }}>
              <div className="welcome-form__field">
                <label htmlFor="phone">Phone <span>(optional)</span></label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" autoComplete="tel" />
              </div>
              <div className="welcome-form__field">
                <label htmlFor="cityCountry">City / Country <span>(optional)</span></label>
                <input id="cityCountry" type="text" value={cityCountry} onChange={(e) => setCityCountry(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </details>
          <label className="welcome-form__consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>
              Save {petName.trim() || 'my pet'}&apos;s record on this device and use my email only to
              send summaries I request. No account is created yet — you can clear this anytime.
            </span>
          </label>
        </>
      )}

      {error && <p className="welcome-form__error" role="alert">{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        {step === 2 && (
          <button
            type="button"
            className="btn btn--ghost btn--lg"
            onClick={() => { setError(null); setStep(1); }}
          >
            ← Back
          </button>
        )}
        <button
          type="submit"
          className="btn btn--pri btn--lg"
          data-mag
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {step === 1 ? 'Continue' : isSubmitting ? 'Opening your dashboard…' : 'Create free profile'}
        </button>
      </div>

      <p className="welcome-form__note">
        {step === 1
          ? 'Two quick steps — under a minute. No card, no account.'
          : 'Your email is only used for summaries you ask for. Phone is never required.'}
      </p>
    </form>
  );
}
