import type { Metadata } from 'next';
import CareJourneyModeSwitcher from '@/components/CareJourneyModeSwitcher';
import DemoCta from '@/components/DemoCta';

export const metadata: Metadata = {
  title: 'PAWai — Interactive Demo',
  description:
    'Watch how a PAWai guided health check works: a few structured questions, organized into a vet-ready summary.',
  alternates: { canonical: '/demo' },
};

export default function DemoPage() {
  return (
    <>
      <section className="hero" aria-labelledby="demo-hero-h1" style={{ paddingBottom: 56 }}>
        <div className="wrap" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div data-r>
            <span className="ey"><span className="dot" aria-hidden="true" />Interactive demo</span>
          </div>
          <h1 id="demo-hero-h1" data-r data-d="1" style={{ fontSize: 'clamp(2.2rem,4.5vw,3.6rem)' }}>
            See a guided health check in action
          </h1>
          <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto' }}>
            This is a demo walkthrough. In your own record, you answer a few guided questions
            about what you&apos;re seeing, and PAWai organizes it into a vet-ready summary.
          </p>
        </div>
      </section>

      <section className="sec" aria-label="AI care journey demo" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <CareJourneyModeSwitcher />
        </div>
      </section>

      <section className="sec how" aria-labelledby="demo-feat-h2">
        <div className="wrap">
          <div className="sec__hd">
            <h2 id="demo-feat-h2" data-r>Built to make every intake count.</h2>
          </div>
          <div className="feats">
            <div className="feat" data-tilt data-r>
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(var(--teal-rgb),.1)' }} aria-hidden="true">🩺</div>
              <h3>Asks like a real vet nurse</h3>
              <p>Each next question depends on the last answer — different complaints lead down entirely different interview paths.</p>
            </div>
            <div className="feat" data-tilt data-r data-d="1">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(var(--peach-rgb),.11)' }} aria-hidden="true">🚨</div>
              <h3>Flags urgency signals</h3>
              <p>PAWai watches for red flags as the conversation unfolds and updates priority as it learns more.</p>
            </div>
            <div className="feat" data-tilt data-r data-d="2">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(180,100,160,.12)' }} aria-hidden="true">📋</div>
              <h3>Prepares the vet before the visit</h3>
              <p>A clean, vet-ready summary you can bring to the appointment.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" aria-labelledby="demo-cta-h2">
        <div className="wrap">
          <div className="cta__card" data-r>
            <h2 id="demo-cta-h2">Ready to try it with your own pet?</h2>
            <p>PAWai gets more helpful once it knows your pet — free, no card needed.</p>
            <div className="btns">
              <DemoCta />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
