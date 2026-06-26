import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers at PAWai',
  description: 'PAWai is a small, early-stage team. We are not actively hiring publicly right now, but we would like to hear from you.',
};

export default function CareersPage() {
  return (
    <section className="sec" aria-labelledby="careers-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Careers</span>
        </div>
        <h1 id="careers-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          We&apos;re a small team, building carefully.
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 18 }}>
            PAWai isn&apos;t actively hiring for open roles right now. We&apos;re an early-stage team, and we&apos;d rather grow deliberately than quickly.
          </p>
          <p style={{ marginBottom: 18 }}>
            That said, if you care about veterinary medicine, pet health education, or building AI tools responsibly, we&apos;d genuinely like to hear from you. Send a note to{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>contact.pawai.it@gmail.com</a>{' '}
            and tell us what you&apos;re interested in working on.
          </p>
        </div>
      </div>
    </section>
  );
}
