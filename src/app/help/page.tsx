import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center — PAWai',
  description: 'Find educational guides in the PAWai Knowledge Hub, or contact us directly for help.',
};

export default function HelpPage() {
  return (
    <section className="sec" aria-labelledby="help-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Help center</span>
        </div>
        <h1 id="help-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          How can we help?
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 18 }}>
            Most questions about pet health, preventive care, and how PAWai works are answered in our{' '}
            <Link href="/blog" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Knowledge Hub</Link>.
          </p>
          <p style={{ marginBottom: 18 }}>
            For anything else &mdash; account questions, technical issues, or feedback &mdash; reach us directly:
          </p>
          <p style={{ marginBottom: 8 }}>
            <a href="mailto:contact.pawai.it@gmail.com" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>contact.pawai.it@gmail.com</a>
          </p>
          <p style={{ marginBottom: 18 }}>
            <a href="tel:+17789004775" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>+1 (778) 900-4775</a>
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--tx3)' }}>
            PAWai is not a substitute for emergency veterinary care. If your pet is in immediate danger, contact your nearest veterinary emergency clinic right away.
          </p>
        </div>
      </div>
    </section>
  );
}
