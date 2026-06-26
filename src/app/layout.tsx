import type { Metadata } from 'next';
import './globals.css';
import AmbientBackground from '@/components/AmbientBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractionEngine from '@/components/InteractionEngine';
import SupportWidget from '@/components/SupportWidget';

export const metadata: Metadata = {
  title: 'PAWai — The AI Health Companion for Every Pet',
  description:
    "Describe your pet's symptoms and get clear, veterinarian-reviewed guidance in minutes—anytime, anywhere.",
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
