import InteractionEngine from '@/components/InteractionEngine';

const PawLogo = ({ size = 30 }: { size?: number }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: size, height: size }}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M32 36c-7.2 0-13 4.6-13 11 0 4.1 3.4 6.5 7.6 6.5 2.3 0 3.8-.9 5.4-.9s3.1.9 5.4.9c4.2 0 7.6-2.4 7.6-6.5 0-6.4-5.8-11-13-11Z"
      fill="#2EDCA8"
    />
    <ellipse cx="18.5" cy="30.5" rx="5" ry="6.2" fill="#2EDCA8" />
    <ellipse cx="45.5" cy="30.5" rx="5" ry="6.2" fill="#2EDCA8" />
    <ellipse cx="27" cy="20" rx="4.6" ry="5.8" fill="#2EDCA8" />
    <ellipse cx="40" cy="20" rx="4.6" ry="5.8" fill="#F0915A" />
    <path
      d="M40 16.4l1.1 2.3 2.5.3-1.9 1.7.5 2.5L40 22l-2.2 1.2.5-2.5-1.9-1.7 2.5-.3L40 16.4Z"
      fill="#050e0a"
    />
  </svg>
);

export default function Home() {
  return (
    <>
      {/* Cursor */}
      <div id="c-dot" aria-hidden="true" />
      <div id="c-ring" aria-hidden="true" />

      {/* Ambient glow */}
      <div
        id="glow"
        aria-hidden="true"
        style={{ transform: 'translate(calc(50vw - 450px),calc(50vh - 450px))' }}
      />

      {/* Dot grid */}
      <div id="grid-bg" aria-hidden="true" />

      {/* Blobs */}
      <div
        className="blob"
        aria-hidden="true"
        style={{
          width: 750, height: 750,
          background: 'rgba(46,220,168,.07)',
          top: -220, right: -180,
          animation: 'blob1 24s ease-in-out infinite',
        }}
      />
      <div
        className="blob"
        aria-hidden="true"
        style={{
          width: 550, height: 550,
          background: 'rgba(240,145,90,.055)',
          bottom: '8%', left: -160,
          animation: 'blob2 30s ease-in-out infinite',
        }}
      />

      {/* Particles */}
      <canvas id="pts" aria-hidden="true" />

      <div className="site">
        {/* NAV */}
        <header className="nav">
          <div className="nav__i">
            <a className="brand" href="#" aria-label="PAWai — home">
              <PawLogo size={30} />
              PAW<b>ai</b>
            </a>
            <nav className="nav__l" aria-label="Main navigation">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#vets">For vets</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <div className="nav__r">
              <a className="nav__login" href="#">Log in</a>
              <button className="btn btn--pri btn--sm" data-mag>Get the app</button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero" aria-labelledby="hero-h1">
          <div className="wrap hero__grid">
            <div>
              <div data-r>
                <span className="ey"><span className="dot" aria-hidden="true" />Vet-reviewed AI · 24/7</span>
              </div>
              <h1 id="hero-h1" data-r data-d="1">
                The AI health companion for <span className="hl">every animal</span>.
              </h1>
              <p className="hero__lead" data-r data-d="2">
                PAWai listens to your worries, checks symptoms against millions of cases, and tells you what to do next — backed by licensed vets. Peace of mind, any hour.
              </p>
              <div className="hero__cta" data-r data-d="3">
                <button className="btn btn--pri btn--lg" data-mag>Start free check</button>
                <button className="btn btn--ghost btn--lg" data-mag>▶ Watch demo</button>
              </div>
              <div className="hero__trust" data-r data-d="4">
                <div className="avs" aria-hidden="true">
                  <span>🐕</span><span>🐈</span><span>🐰</span><span>🐎</span>
                </div>
                <small><b>240,000+</b> pet parents trust PAWai</small>
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
                      <div className="vcard"><div className="lbl">Activity</div><div className="val">86<b>%</b></div></div>
                      <div className="vcard"><div className="lbl">Resting HR</div><div className="val">72<b>bpm</b></div></div>
                    </div>
                    <div className="ch ch--me">Bella&apos;s been scratching her left ear since yesterday.</div>
                    <div className="ch ch--ai">
                      <div className="ch__tag">🩺 PAWai</div>
                      Ear scratching often points to an infection. Can you send a photo? I&apos;ll flag it for Dr. Okafor.
                    </div>
                  </div>
                </div>
              </div>
              <div className="fc fc--a">
                <div className="ico" style={{ background: 'rgba(46,220,168,.14)' }}>✓</div>
                <div>Reviewed by a vet<small>in under 10 min</small></div>
              </div>
              <div className="fc fc--b">
                <div className="ico" style={{ background: 'rgba(240,145,90,.14)' }}>📋</div>
                <div>Health record saved<small>Bella · Labrador, 4y</small></div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGOS */}
        <div className="logos">
          <div className="wrap">
            <p>Trusted by clinics &amp; shelters everywhere</p>
            <div className="logos__row" aria-hidden="true">
              <span>🏥 Brightpaw Vet</span>
              <span>🐾 Harborside Animal</span>
              <span>🌿 Willow Clinic</span>
              <span>🦴 Northgate Pets</span>
              <span>❤ RescueHub</span>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section className="sec" id="features" aria-labelledby="feat-h2">
          <div className="wrap">
            <div className="sec__hd">
              <div data-r><span className="ey"><span className="dot" aria-hidden="true" />What PAWai does</span></div>
              <h2 id="feat-h2" data-r data-d="1">Care that never sleeps.</h2>
              <p data-r data-d="2">From the first sniffle to ongoing conditions, PAWai is the calm, knowledgeable companion in your pocket.</p>
            </div>
            <div className="feats">
              <div className="feat" data-tilt data-r>
                <div className="cg" aria-hidden="true" />
                <div className="ic" style={{ background: 'rgba(46,220,168,.1)' }} aria-hidden="true">🔍</div>
                <h3>Symptom checker</h3>
                <p>Describe what you&apos;re seeing in plain words. PAWai asks the right follow-ups and gives a clear, ranked sense of what might be going on.</p>
              </div>
              <div className="feat" data-tilt data-r data-d="1">
                <div className="cg" aria-hidden="true" />
                <div className="ic" style={{ background: 'rgba(240,145,90,.11)' }} aria-hidden="true">🩺</div>
                <h3>Vet in the loop</h3>
                <p>Every urgent flag is reviewed by a licensed veterinarian, usually within minutes — so you&apos;re never acting on a guess.</p>
              </div>
              <div className="feat" data-tilt data-r data-d="2">
                <div className="cg" aria-hidden="true" />
                <div className="ic" style={{ background: 'rgba(180,100,160,.12)' }} aria-hidden="true">📈</div>
                <h3>Health timeline</h3>
                <p>Weight, meds, vaccinations and visits in one tidy record. Spot trends early and share with your clinic in a tap.</p>
              </div>
              <div className="feat feat--wide" data-r data-d="1">
                <div>
                  <div style={{ marginBottom: 18 }}><span className="ey"><span className="dot" aria-hidden="true" />Multi-species</span></div>
                  <h3>Built for the whole barn, not just the couch.</h3>
                  <p>Dogs, cats, rabbits, horses, reptiles and pocket pets. PAWai&apos;s models are trained across species so every animal gets the same attentive eye.</p>
                  <div className="chips">
                    <span>🐕 Dogs</span><span>🐈 Cats</span><span>🐰 Small pets</span><span>🐎 Equine</span><span>🦎 Exotics</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <div className="subg"><div className="lb">🚨 Early warning</div><div className="dc">Flags subtle changes in eating, activity or behavior before they become emergencies.</div></div>
                  <div className="subg"><div className="lb">💊 Med reminders</div><div className="dc">Never miss a dose with smart schedules and refill nudges.</div></div>
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
                <p>Type, talk, or snap a photo. Describe the symptom the way you&apos;d tell a friend — no medical jargon needed.</p>
              </div>
              <div className="step" data-r data-d="1">
                <div className="step__n" aria-hidden="true">2</div>
                <h3>Get a clear read</h3>
                <p>PAWai weighs the symptoms against millions of cases and your pet&apos;s history, then explains what it found and how urgent it is.</p>
              </div>
              <div className="step" data-r data-d="2">
                <div className="step__n" aria-hidden="true">3</div>
                <h3>Know your next move</h3>
                <p>Home care, monitor, or see a vet now — with the nearest open clinic and a vet-reviewed note ready to share.</p>
              </div>
            </div>
          </div>
        </section>

        {/* VETS */}
        <section className="sec" id="vets" aria-labelledby="vets-h2">
          <div className="wrap vets__i">
            <div>
              <div data-r><span className="ey"><span className="dot" aria-hidden="true" />For clinics &amp; vets</span></div>
              <h2
                id="vets-h2"
                style={{ fontSize: 'clamp(1.75rem,3.5vw,2.7rem)', margin: '18px 0 18px', letterSpacing: '-0.025em' }}
                data-r
                data-d="1"
              >
                A teammate that handles the 2am worries.
              </h2>
              <p
                style={{ fontSize: '1.03rem', lineHeight: 1.72, color: 'var(--tx2)', marginBottom: 26 }}
                data-r
                data-d="2"
              >
                PAWai triages routine questions, preps structured intake notes, and routes the truly urgent cases straight to you.
              </p>
              <button className="btn btn--accent btn--md" data-mag data-r data-d="3">
                Partner with PAWai
              </button>
            </div>
            <div className="stat-g" data-r data-d="1">
              <div className="stat"><div className="n">68<b>%</b></div><div className="l">fewer non-urgent calls after hours</div></div>
              <div className="stat"><div className="n">&lt;10<b>m</b></div><div className="l">median vet review time on flags</div></div>
              <div className="stat"><div className="n">4.9<b>★</b></div><div className="l">average rating from pet parents</div></div>
              <div className="stat"><div className="n">1,200<b>+</b></div><div className="l">clinics on the PAWai network</div></div>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="sec how" aria-label="Customer testimonial">
          <div className="wrap quote">
            <div className="mark" data-r aria-hidden="true">&ldquo;</div>
            <p data-r data-d="1">
              I caught Bella&apos;s ear infection days before it got bad. PAWai told me exactly what to watch for and a real vet confirmed it the same morning.
            </p>
            <div className="who" data-r data-d="2">
              <div className="ph" aria-hidden="true">👩</div>
              <div style={{ textAlign: 'left' }}>
                <b>Maya Hernandez</b>
                <small>Pet parent to Bella 🐕</small>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="pricing" aria-labelledby="cta-h2">
          <div className="wrap">
            <div className="cta__card" data-r>
              <h2 id="cta-h2">
                Your pet can&apos;t tell you what&apos;s wrong.<br />PAWai can help you listen.
              </h2>
              <p>Start free — your first health check and timeline are on us, no card needed.</p>
              <div className="btns">
                <button className="btn btn--pri btn--lg" data-mag>Download for iOS</button>
                <button className="btn btn--ghost btn--lg" data-mag>Download for Android</button>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="wrap">
            <div className="footer__top">
              <div>
                <a className="brand" href="#" aria-label="PAWai — home">
                  <PawLogo size={28} />
                  PAW<b>ai</b>
                </a>
                <p>The AI health companion for every animal. Vet-reviewed care, available any hour of the day.</p>
              </div>
              <div>
                <h4>Product</h4>
                <ul>
                  <li><a href="#">Symptom checker</a></li>
                  <li><a href="#">Health timeline</a></li>
                  <li><a href="#">For vets</a></li>
                  <li><a href="#">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Press</a></li>
                  <li><a href="#">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4>Support</h4>
                <ul>
                  <li><a href="#">Help center</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Privacy</a></li>
                  <li><a href="#">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="footer__bot">
              <span>© 2026 PAWai, Inc. PAWai is not a substitute for emergency veterinary care.</span>
              <span>Made with 🐾 for animals everywhere</span>
            </div>
          </div>
        </footer>
      </div>

      <InteractionEngine />
    </>
  );
}
