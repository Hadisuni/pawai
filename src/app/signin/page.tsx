import type { Metadata } from 'next';
import SignInForm from '@/components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in to PAWai',
  description: 'Sign in to PAWai with a passwordless email link.',
  alternates: { canonical: '/signin' },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  return (
    <section className="hero" aria-labelledby="signin-h1">
      <div className="wrap" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Sign in</span>
        </div>
        <h1 id="signin-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Access your pet&apos;s record.
        </h1>
        <p className="hero__lead" data-r data-d="2" style={{ margin: '0 auto 32px' }}>
          Enter your email and we&apos;ll send you a link — no password to remember.
        </p>
        <div data-r data-d="3">
          <SignInForm initialError={error} returnTo={returnTo} />
        </div>
      </div>
    </section>
  );
}
