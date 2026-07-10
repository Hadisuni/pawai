import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero" aria-labelledby="hero-h1">
        <div className="wrap hero__grid">
          <div>
            <div data-r>
              <span className="ey"><span className="dot" aria-hidden="true" />AI-guided pet health support · 24/7</span>
            </div>
            <h1 id="hero-h1" data-r data-d="1">
              The AI Health Companion for <span className="hl">Every Pet</span>.
            </h1>
            <p className="hero__lead" data-r data-d="2">
              Worried about your pet? Answer a few guided questions and walk away with a clear sense of urgency — and a vet-ready summary you can bring to the clinic.
            </p>
            <div className="hero__cta" data-r data-d="3">
              <Link href="/welcome" className="btn btn--pri btn--lg" data-mag>Create your pet&apos;s free profile</Link>
              <Link href="/demo" className="btn btn--ghost btn--lg" data-mag>
                ▶ View Interactive Demo
              </Link>
            </div>
            <div className="hero__trust" data-r data-d="4">
              <div className="avs" aria-hidden="true">
                <span>🐕</span><span>🐈</span><span>🐰</span>
              </div>
              <small><b>Free in early access</b> — no account, no card needed</small>
            </div>
          </div>

          {/* Phone mock */}
          <div className="phone-stage" data-r data-d="2" aria-hidden="true">
            <div className="phone" data-tilt>
              <div className="phone__scr">
                <div className="psc-top">
                  <div className="row"><span>9:41</span><span>PAWai</span></div>
                  <h3>Good morning, Maya 🐾</h3>
                  <p>Bella&apos;s health looks great today.</p>
                </div>
                <div className="psc-body">
                  <div className="vitals">
                    <div className="vcard"><div className="lbl">Urgency</div><div className="val">Routine</div></div>
                    <div className="vcard"><div className="lbl">Weight</div><div className="val">24<b>kg</b></div></div>
                  </div>
                  <div className="ch ch--me">Bella&apos;s been scratching her left ear since yesterday.</div>
                  <div className="ch ch--ai">
                    <div className="ch__tag">🩺 PAWai</div>
                    Ear scratching can have several causes. Let me ask a few quick questions and organize what we find into a summary for your vet.
                  </div>
                </div>
              </div>
            </div>
            <div className="fc fc--a">
              <div className="ico" style={{ background: 'rgba(var(--teal-rgb),.14)' }}>📋</div>
              <div>Vet-ready summary<small>organized before your visit</small></div>
            </div>
            <div className="fc fc--b">
              <div className="ico" style={{ background: 'rgba(var(--peach-rgb),.14)' }}>🐾</div>
              <div>Health record started<small>Bella · Labrador, 4y</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec" id="features" aria-labelledby="feat-h2">
        <div className="wrap">
          <div className="sec__hd">
            <div data-r><span className="ey"><span className="dot" aria-hidden="true" />What PAWai does</span></div>
            <h2 id="feat-h2" data-r data-d="1">Care that never sleeps.</h2>
            <p data-r data-d="2">From the first sniffle to ongoing conditions, PAWai is the calm, knowledgeable companion in your pocket.</p>
          </div>
          <div className="feats">
            <div className="feat" data-tilt data-r id="symptom-checker">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(var(--teal-rgb),.1)' }} aria-hidden="true">🔍</div>
              <h3>Symptom checker</h3>
              <p>Describe what you&apos;re seeing in plain words. PAWai asks the right follow-ups and gives a clear, ranked sense of what might be going on.</p>
            </div>
            <div className="feat" data-tilt data-r data-d="1">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(var(--peach-rgb),.11)' }} aria-hidden="true">🚨</div>
              <h3>Clear urgency, every time</h3>
              <p>Every conversation ends with a plain-language read: routine, same-day, urgent, or emergency — so you know what to do next, not just what it might be.</p>
            </div>
            <div className="feat" data-tilt data-r data-d="2" id="health-timeline">
              <div className="cg" aria-hidden="true" />
              <div className="ic" style={{ background: 'rgba(180,100,160,.12)' }} aria-hidden="true">📈</div>
              <h3>A record that builds over time</h3>
              <p>Log weight, meds and vaccinations as you go. Every conversation adds to your pet&apos;s story — one calm place instead of scattered notes.</p>
            </div>
            <div className="feat feat--wide" data-r data-d="1">
              <div>
                <div style={{ marginBottom: 18 }}><span className="ey"><span className="dot" aria-hidden="true" />For dogs, cats &amp; more</span></div>
                <h3>Made for the pets who share your home.</h3>
                <p>PAWai starts with dogs and cats — the pets we know best — and treats every animal with the same attentive, unhurried care.</p>
                <div className="chips">
                  <span>🐕 Dogs</span><span>🐈 Cats</span><span>🐾 More coming</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div className="subg"><div className="lb">📋 Vet-ready summary</div><div className="dc">Walk into your appointment with the whole story organized — your vet will thank you.</div></div>
                <div className="subg"><div className="lb">🤝 Honest by design</div><div className="dc">PAWai organizes information; it never diagnoses. Medical decisions always belong to your veterinarian.</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec how" id="how" aria-labelledby="how-h2">
        <div className="wrap">
          <div className="sec__hd">
            <div data-r><span className="ey"><span className="dot" aria-hidden="true" />How it works</span></div>
            <h2 id="how-h2" data-r data-d="1">Three taps to peace of mind.</h2>
          </div>
          <div className="steps">
            <div className="step" data-r>
              <div className="step__n" aria-hidden="true">1</div>
              <h3>Tell PAWai what&apos;s up</h3>
              <p>Describe what you&apos;re seeing the way you&apos;d tell a friend — PAWai guides you through the right follow-up questions, no medical jargon needed.</p>
            </div>
            <div className="step" data-r data-d="1">
              <div className="step__n" aria-hidden="true">2</div>
              <h3>Get a clear read</h3>
              <p>As you answer, PAWai tracks what matters and explains how urgent things look — routine, same-day, urgent, or emergency.</p>
            </div>
            <div className="step" data-r data-d="2">
              <div className="step__n" aria-hidden="true">3</div>
              <h3>Know your next move</h3>
              <p>Home care, monitor, or see a vet — with a vet-ready summary of the whole conversation to bring to the appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-labelledby="cta-h2">
        <div className="wrap">
          <div className="cta__card" data-r>
            <h2 id="cta-h2">
              Your pet can&apos;t tell you what&apos;s wrong.<br />PAWai can help you listen.
            </h2>
            <p>Free while in early access — no account, no card, no catch.</p>
            <div className="btns">
              <Link href="/welcome" className="btn btn--pri btn--lg" data-mag>Create your pet&apos;s free profile</Link>
              <Link href="/demo" className="btn btn--ghost btn--lg" data-mag>View interactive demo</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
