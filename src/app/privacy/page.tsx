import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — PAWai',
  description: 'What PAWai collects, why, who processes it, and how to get it deleted.',
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = 'October 19, 2026';

const h2Style = { fontFamily: 'var(--font-d)', fontSize: '1.3rem', color: 'var(--tx1)', margin: '0 0 14px' } as const;
const pStyle = { marginBottom: 28 } as const;
const listStyle = { margin: '0 0 28px', paddingLeft: 22 } as const;
const linkStyle = { color: 'var(--teal)', textDecoration: 'underline' } as const;

export default function PrivacyPolicyPage() {
  return (
    <section className="sec" aria-labelledby="privacy-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Privacy policy</span>
        </div>
        <h1 id="privacy-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          What we collect, and why.
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--tx3)' }}>Last updated: {LAST_UPDATED}</p>
          <p style={pStyle}>
            PAWai is operated from Vancouver, British Columbia, Canada. This policy explains, in plain language, what personal information PAWai handles when you use pawai.it.com, what it is used for, and the choices you have.
          </p>

          <h2 style={h2Style}>What we collect</h2>
          <ul style={listStyle}>
            <li><strong>When you save a summary or record:</strong> your name and email address, your pet&apos;s name and species, and anything else you choose to add — breed, age, sex, weight, the concern you discussed, the summary itself, and weight, vaccination or note entries.</li>
            <li><strong>When you sign in:</strong> your email address, used to send a one-time sign-in link.</li>
            <li><strong>When you contact us:</strong> your name, email address, optional phone number, and your message.</li>
            <li><strong>When you use a voice assistant:</strong> your voice and the conversation are processed by our voice provider (see below) for as long as the session runs.</li>
          </ul>
          <p style={pStyle}>
            We do not ask for payment details, and PAWai does not use advertising or third-party tracking cookies.
          </p>

          <h2 style={h2Style}>How we use it</h2>
          <ul style={listStyle}>
            <li>To show you your pet&apos;s record and send you your summary and private record link.</li>
            <li>To sign you in and keep you signed in.</li>
            <li>To reply to messages you send us.</li>
            <li>To keep the service working and secure, and to fix problems.</li>
          </ul>
          <p style={pStyle}>
            We do not sell your personal information, and we do not use it to make medical decisions about your pet — PAWai does not diagnose or recommend treatment (see our{' '}
            <Link href="/trust" style={linkStyle}>Trust Center</Link>).
          </p>

          <h2 style={h2Style}>Who processes it for us</h2>
          <p style={{ marginBottom: 14 }}>
            We rely on a small number of service providers. They process information only to provide their service to PAWai, and some of them store it outside Canada (for example, in the United States):
          </p>
          <ul style={listStyle}>
            <li><strong>Vercel</strong> — hosts the website.</li>
            <li><strong>Our database provider (PostgreSQL)</strong> — stores pet records, owners and sign-in sessions.</li>
            <li><strong>Resend</strong> — sends summary and sign-in emails.</li>
            <li><strong>n8n and Google (Gmail, Google Sheets)</strong> — receive intake and contact submissions, notify our team, and may send confirmation emails.</li>
            <li><strong>ElevenLabs</strong> — runs the voice assistants.</li>
          </ul>

          <h2 style={h2Style}>Stored on your device</h2>
          <p style={pStyle}>
            PAWai saves some things in your browser&apos;s local storage so the site works without an account: your colour theme, an in-progress conversation draft, and a device-local copy of your record. When you sign in or save a record, we set one sign-in cookie (<code>paw_session</code>) that is not readable by scripts and expires after 30 days. Clearing your browser data removes the local copies; signing out removes the session.
          </p>

          <h2 style={h2Style}>How long we keep it</h2>
          <p style={pStyle}>
            Records are kept until you ask us to delete them. Sign-in links expire after 15 minutes and sign-in sessions after 30 days. Contact messages are kept only as long as needed to handle your request.
          </p>

          <h2 style={h2Style}>Your choices and rights</h2>
          <p style={pStyle}>
            You can ask us to access, correct or delete the personal information we hold about you, or withdraw your consent to us using it, at any time. Email{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={linkStyle}>contact.pawai.it@gmail.com</a>{' '}
            from the address you used with PAWai and we will respond within 30 days. If you are not satisfied with our answer, you can contact the Office of the Information and Privacy Commissioner for British Columbia.
          </p>

          <h2 style={h2Style}>Security</h2>
          <p style={pStyle}>
            Private record links and sign-in sessions use long random tokens, and all traffic is encrypted in transit. A record link works like a key — anyone who has it can open the record, so please don&apos;t share it publicly. No system is perfectly secure; if we learn of a breach that affects you, we will tell you.
          </p>

          <h2 style={h2Style}>Children</h2>
          <p style={pStyle}>
            PAWai is intended for adults. If you believe a child has given us personal information, contact us and we will delete it.
          </p>

          <h2 style={h2Style}>Changes to this policy</h2>
          <p style={pStyle}>
            If we change this policy, we will update the date at the top of this page. Significant changes will be highlighted on the site.
          </p>

          <p style={{ fontSize: '0.88rem', color: 'var(--tx3)' }}>
            See also our{' '}
            <Link href="/terms" style={linkStyle}>Terms of Use</Link>. Questions? Reach us at{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={linkStyle}>contact.pawai.it@gmail.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
