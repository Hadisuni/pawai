import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use — PAWai',
  description: 'The terms for using PAWai — an educational tool for pet owners, not a veterinary service.',
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = 'October 19, 2026';

const h2Style = { fontFamily: 'var(--font-d)', fontSize: '1.3rem', color: 'var(--tx1)', margin: '0 0 14px' } as const;
const pStyle = { marginBottom: 28 } as const;
const linkStyle = { color: 'var(--teal)', textDecoration: 'underline' } as const;

export default function TermsOfUsePage() {
  return (
    <section className="sec" aria-labelledby="terms-h1">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Terms of use</span>
        </div>
        <h1 id="terms-h1" data-r data-d="1" style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '18px 0 22px', letterSpacing: '-0.02em' }}>
          The terms, in plain language.
        </h1>
        <div data-r data-d="2" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--tx2)' }}>
          <p style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--tx3)' }}>Last updated: {LAST_UPDATED}</p>
          <p style={pStyle}>
            These terms apply when you use pawai.it.com and its tools (&quot;PAWai&quot;). By using PAWai you agree to them. If you don&apos;t agree, please don&apos;t use the service.
          </p>

          <h2 style={h2Style}>PAWai is not veterinary care</h2>
          <p style={pStyle}>
            PAWai organizes information and educates pet owners. <strong>It does not diagnose conditions, prescribe, or recommend treatment</strong>, and using it does not create a veterinarian–client–patient relationship. Summaries, guided questions, voice assistants and Evidence Library content are for information only. Always consult a licensed veterinarian for decisions about your pet&apos;s health. <strong>In an emergency, contact your nearest veterinary emergency clinic right away</strong> — do not wait for PAWai.
          </p>

          <h2 style={h2Style}>AI-generated content</h2>
          <p style={pStyle}>
            Some content is produced or assisted by AI. It can be incomplete or wrong. Check anything important with your veterinarian, and see the{' '}
            <Link href="/trust" style={linkStyle}>Trust Center</Link>{' '}
            for how we grade evidence.
          </p>

          <h2 style={h2Style}>Your information and your record</h2>
          <p style={pStyle}>
            You are responsible for the information you enter and for keeping your private record link and sign-in emails to yourself — anyone with a record link can open that record. How we handle personal information is described in our{' '}
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>.
          </p>

          <h2 style={h2Style}>Acceptable use</h2>
          <p style={pStyle}>
            Don&apos;t misuse PAWai: no attempts to break or overload the service, access other people&apos;s records, send spam through our forms, or use it for anything unlawful. We may suspend access that puts the service or other users at risk.
          </p>

          <h2 style={h2Style}>Our content</h2>
          <p style={pStyle}>
            The PAWai name, site design and original content belong to PAWai. You may share links and short quotes with attribution. Research papers cited in the Evidence Library belong to their authors and publishers.
          </p>

          <h2 style={h2Style}>No warranty, limited liability</h2>
          <p style={pStyle}>
            PAWai is provided &quot;as is&quot;, without guarantees that it will be accurate, uninterrupted or error-free. To the extent the law allows, PAWai is not liable for losses arising from your use of the service, including decisions about your pet&apos;s care made on the basis of its content. Nothing in these terms limits rights you have under consumer protection laws that cannot be waived.
          </p>

          <h2 style={h2Style}>Changes</h2>
          <p style={pStyle}>
            We may update these terms or change the service. We will update the date at the top of this page when we do; continuing to use PAWai after a change means you accept the updated terms.
          </p>

          <h2 style={h2Style}>Governing law</h2>
          <p style={pStyle}>
            These terms are governed by the laws of British Columbia and the federal laws of Canada that apply there.
          </p>

          <p style={{ fontSize: '0.88rem', color: 'var(--tx3)' }}>
            Questions about these terms? Reach us at{' '}
            <a href="mailto:contact.pawai.it@gmail.com" style={linkStyle}>contact.pawai.it@gmail.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
