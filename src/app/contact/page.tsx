import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact PAWai',
  description: 'Send a message to the PAWai team — we usually reply within one business day.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <section className="hero" aria-labelledby="contact-h1">
      <div className="wrap" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Contact us</span>
        </div>
        <h1 id="contact-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Send us a message.
        </h1>
        <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
          Questions, feedback, or anything else — we&apos;ll get back to you shortly.
        </p>
        <div data-r data-d="3">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
