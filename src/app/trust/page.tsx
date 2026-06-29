import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trust Center — PAWai',
  description: 'How PAWai handles evidence and AI-generated content — and what it does not do.',
  alternates: { canonical: '/trust' },
};

export default function TrustCenterPage() {
  return (
    <section className="sec" aria-labelledby="trust-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Trust center</span>
        </div>
        <h1 id="trust-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          How PAWai earns trust.
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 28 }}>
            PAWai is built to support pet owners and veterinary teams — not to replace clinical judgment. This page lays out, plainly, what that means in practice.
          </p>

          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', color: 'var(--tx1)', margin: '0 0 14px' }}>
            Evidence, graded honestly
          </h2>
          <p style={{ marginBottom: 28 }}>
            Our{' '}
            <Link href="/research" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Evidence Library</Link>{' '}
            traces every research insight back to a real, peer-reviewed paper, with its evidence level, study type, and limitations shown next to the claim — not buried in a footnote. Weaker evidence is labeled as weaker evidence, not rounded up.
          </p>

          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', color: 'var(--tx1)', margin: '0 0 14px' }}>
            What PAWai does not do
          </h2>
          <p style={{ marginBottom: 28 }}>
            PAWai organizes information and educates pet owners. <strong>PAWai does not diagnose conditions or recommend treatment.</strong> Nothing PAWai produces — including anything in the Evidence Library — is intended for decision-making on its own. Always consult a licensed veterinarian for medical decisions about your pet.
          </p>

          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', color: 'var(--tx1)', margin: '0 0 14px' }}>
            In an emergency
          </h2>
          <p style={{ marginBottom: 28, fontSize: '0.95rem' }}>
            PAWai is not a substitute for emergency veterinary care. If your pet is in immediate danger, contact your nearest veterinary emergency clinic right away.
          </p>

          <p style={{ fontSize: '0.88rem', color: 'var(--tx3)' }}>
            Questions about how PAWai works? Visit the{' '}
            <Link href="/help" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Help Center</Link>{' '}
            or reach us directly at{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>contact.pawai.it@gmail.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
