import type { Metadata } from 'next';
import Link from 'next/link';
import CareJourneyModeSwitcher from '@/components/CareJourneyModeSwitcher';

export const metadata: Metadata = {
  title: "PAWai — Your Pet's AI Care Journey",
  description:
    'Watch PAWai conduct a real adaptive intake interview, reason through findings live, and prepare a vet-ready summary before the visit even starts.',
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
            Your Pet&apos;s AI Care Journey
          </h1>
          <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto' }}>
            Watch PAWai run a real adaptive intake call — asking the right next question, reasoning through findings live, and preparing a vet-ready summary before the visit even starts.
          </p>
        </div>
      </section>

      <section className="sec" aria-label="Live AI care journey demo" style={{ paddingTop: 0 }}>
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
              <h3>Flags urgency signals live</h3>
              <p>PAWai watches for red flags as the conversation unfolds and updates priority in real time.</p>
            </div>
            <div className="feat" data-tilt data-r data-d="2">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(180,100,160,.12)' }} aria-hidden="true">📋</div>
              <h3>Prepares the vet before the visit</h3>
              <p>A clean, vet-ready summary arrives before the appointment even starts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" aria-labelledby="demo-cta-h2">
        <div className="wrap">
          <div className="cta__card" data-r>
            <h2 id="demo-cta-h2">Ready to see what PAWai notices first?</h2>
            <p>Start your pet&apos;s first health check — free, no card needed.</p>
            <div className="btns">
              <Link href="/welcome" className="btn btn--pri btn--lg" data-mag>
                Start Free Pet Check
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
