import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import AmbientBackground from '@/components/AmbientBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractionEngine from '@/components/InteractionEngine';
import SupportWidget from '@/components/SupportWidget';
import { THEME_INIT_SCRIPT } from '@/components/ThemeToggle';
import { SITE_URL } from '@/lib/site';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'PAWai — The AI Health Companion for Every Pet',
  description:
    "Describe your pet's symptoms and get clear, veterinarian-reviewed guidance in minutes—anytime, anywhere.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body>
        {/* Sets data-theme before paint so the page never flashes the wrong theme.
            beforeInteractive guarantees this runs ahead of hydration. */}
        <Script id="theme-init" strategy="beforeInteractive">{THEME_INIT_SCRIPT}</Script>
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
