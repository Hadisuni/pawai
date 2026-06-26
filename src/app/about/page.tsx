import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About PAWai — The AI Health Companion for Every Pet',
  description: 'PAWai helps pet owners organize what they’re observing and arrive at veterinary visits prepared — without ever diagnosing or replacing a veterinarian.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <section className="sec" aria-labelledby="about-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />About PAWai</span>
        </div>
        <h1 id="about-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          The AI Health Companion for Every Pet
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 18 }}>
            PAWai exists for the moment between noticing something is off with your pet and getting in front of a veterinarian. We help pet owners describe what they&apos;re seeing clearly, organize it into a structured summary, and arrive at appointments prepared.
          </p>
          <p style={{ marginBottom: 18 }}>
            <strong style={{ color: 'var(--tx1)' }}>PAWai does not diagnose conditions, and it does not recommend treatment.</strong>{' '}
            It does not replace a veterinarian&apos;s clinical judgment. We built it to support the relationship between pet owners and veterinary teams &mdash; never to stand in for either side of it.
          </p>
          <p style={{ marginBottom: 18 }}>
            We&apos;re an early-stage team based in Vancouver, BC, Canada, building PAWai alongside a growing <Link href="/blog" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Knowledge Hub</Link> of educational, veterinarian-informed content for pet owners.
          </p>
        </div>
      </div>
    </section>
  );
}
