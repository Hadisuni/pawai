import type { Metadata } from 'next';
import ExperiencePicker from '@/components/ExperiencePicker';

export const metadata: Metadata = {
  title: 'PAWai — Choose an Experience',
};

export default function ExperiencesPage() {
  return (
    <section className="hero" aria-labelledby="exp-h1">
      <div className="wrap" style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <div data-r>
          <span className="ey"><span className="dot" aria-hidden="true" />Choose an experience</span>
        </div>
        <h1 id="exp-h1" data-r data-d="1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          What would you like help with today?
        </h1>
        <ExperiencePicker />
      </div>
    </section>
  );
}
