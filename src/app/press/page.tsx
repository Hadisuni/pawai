import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press — PAWai',
  description: 'Press and media inquiries for PAWai, the AI health companion for every pet.',
};

export default function PressPage() {
  return (
    <section className="sec" aria-labelledby="press-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Press</span>
        </div>
        <h1 id="press-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          Press &amp; media inquiries
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 18 }}>
            For interviews, fact-checking, or media inquiries about PAWai, reach us directly at{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>contact.pawai.it@gmail.com</a>.
          </p>
          <p style={{ marginBottom: 8, fontWeight: 700, color: 'var(--tx1)' }}>Boilerplate</p>
          <p style={{ marginBottom: 18 }}>
            PAWai is an AI health companion that helps pet owners organize what they&apos;re observing about their pet and arrive at veterinary visits prepared. PAWai does not diagnose conditions or recommend treatment, and is built to support &mdash; never replace &mdash; the relationship between pet owners and licensed veterinarians.
          </p>
        </div>
      </div>
    </section>
  );
}
