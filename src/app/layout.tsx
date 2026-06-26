import type { Metadata } from 'next';
import './globals.css';
import AmbientBackground from '@/components/AmbientBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractionEngine from '@/components/InteractionEngine';
import SupportWidget from '@/components/SupportWidget';

export const metadata: Metadata = {
  title: 'PAWai — The AI health companion for every animal',
  description:
    'PAWai listens to your worries, checks symptoms against millions of cases, and tells you what to do next — backed by licensed vets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AmbientBackground />
        <div className="site">
          <Header />
          {children}
          <Footer />
        </div>
        <InteractionEngine />
        <SupportWidget />
      </body>
    </html>
  );
}
