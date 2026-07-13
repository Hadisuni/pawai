'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'That sign-in link is invalid. Request a new one below.',
  expired: 'That sign-in link has expired. Request a new one below.',
};

// returnTo rides along to the server, which validates it (same-site
// relative paths only) and folds it into the emailed link — the form never
// interprets it itself.
export default function SignInForm({ initialError, returnTo }: { initialError?: string; returnTo?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(
    initialError ? ERROR_MESSAGES[initialError] ?? null : null,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setStatus('submitting');

    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, returnTo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Request failed');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="welcome-form">
        <p className="welcome-form__success" role="status">
          Check your inbox — we&apos;ve sent a sign-in link to {email}. It works once, within 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form className="welcome-form" onSubmit={handleSubmit} aria-label="Sign in to PAWai">
      <div className="welcome-form__field">
        <label htmlFor="signin-email">Email</label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="maya@example.com"
          autoComplete="email"
          required
        />
      </div>

      {error && <p className="welcome-form__error" role="alert">{error}</p>}

      <button
        type="submit"
        className="btn btn--pri btn--lg"
        data-mag
        disabled={status === 'submitting'}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {status === 'submitting' ? 'Sending…' : 'Send sign-in link'}
      </button>

      <p className="welcome-form__note">
        No password needed — we&apos;ll email you a link.
      </p>
    </form>
  );
}
