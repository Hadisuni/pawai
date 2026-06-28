'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    setError(null);
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="welcome-form">
        <p className="welcome-form__success" role="status">
          Thanks for reaching out — we&apos;ve received your message and will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form className="welcome-form" onSubmit={handleSubmit} aria-label="Contact PAWai">
      <div className="welcome-form__field">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maya Hernandez"
          autoComplete="name"
          required
        />
      </div>

      <div className="welcome-form__row">
        <div className="welcome-form__field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maya@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="welcome-form__field">
          <label htmlFor="phone">Phone <span>(optional)</span></label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(778) 900-4775"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="welcome-form__field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          required
        />
      </div>

      {error && <p className="welcome-form__error" role="alert">{error}</p>}
      {status === 'error' && (
        <p className="welcome-form__error" role="alert">
          Something went wrong sending your message. Please try again in a moment.
        </p>
      )}

      <button
        type="submit"
        className="btn btn--pri btn--lg"
        data-mag
        disabled={status === 'submitting'}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>

      <p className="welcome-form__note">
        We typically reply within one business day.
      </p>
    </form>
  );
}
