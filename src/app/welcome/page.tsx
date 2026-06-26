import type { Metadata } from 'next';
import WelcomeForm from '@/components/WelcomeForm';

export const metadata: Metadata = {
  title: 'PAWai — Get Started',
  description: "Tell us about you and your pet so PAWai can personalize your care journey.",
  alternates: { canonical: '/welcome' },
};

export default function WelcomePage() {
  return (
    <section className="hero" aria-labelledby="welcome-h1">
      <div className="wrap" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Get started</span>
        </div>
        <h1 id="welcome-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Let&apos;s get to know you and your pet.
        </h1>
        <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
          A couple of quick details, then we&apos;ll take you straight into PAWai.
        </p>
        <div data-r data-d="3">
          <WelcomeForm />
        </div>
      </div>
    </section>
  );
}
