import type { Metadata } from 'next';
import WelcomeForm from '@/components/WelcomeForm';

export const metadata: Metadata = {
  title: 'PAWai — Create your pet’s free profile',
  description: 'Two quick steps: your pet, then you. Your pet’s health record starts here.',
  alternates: { canonical: '/welcome' },
};

export default function WelcomePage() {
  return (
    <section className="hero" aria-labelledby="welcome-h1">
      <div className="wrap" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Get started</span>
        </div>
        <h1 id="welcome-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Who are we helping today?
        </h1>
        <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
          Create your pet&apos;s free profile — PAWai gets more helpful once it knows your pet.
        </p>
        <div data-r data-d="3" style={{ textAlign: 'left' }}>
          <WelcomeForm />
        </div>
      </div>
    </section>
  );
}
