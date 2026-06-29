import Link from 'next/link';
import PawLogo from './PawLogo';

const SOCIAL_LINKS = [
  {
    label: 'YouTube',
    href: 'https://youtube.com/@pawai-it',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.7a3 3 0 0 0-2.1-2.1C19.4 4 12 4 12 4s-7.4 0-9.4.6A3 3 0 0 0 .5 6.7 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.3 3 3 0 0 0 2.1 2.1c2 .6 9.4.6 9.4.6s7.4 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.3ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/pawai.it',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94Z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/pawaiit',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M18.3 2H21l-6.2 7.1L22 22h-6.6l-5.2-6.8L4.2 22H1.5l6.7-7.6L1 2h6.7l4.7 6.2L18.3 2Zm-2.3 18h1.8L8.1 4H6.2l9.8 16Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/pawai.it',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div>
            <Link className="brand" href="/" aria-label="PAWai — home">
              <PawLogo size={28} />
              PAW<b>ai</b>
            </Link>
            <p>The AI health companion for every pet. Vet-reviewed care, available any hour of the day.</p>
            <div className="footer__social" aria-label="Follow PAWai on social media">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/#symptom-checker">Symptom checker</Link></li>
              <li><Link href="/#health-timeline">Health timeline</Link></li>
              <li><Link href="/#vets">For vets</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/press">Press</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/research">Research</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:contact.pawai.it@gmail.com">contact.pawai.it@gmail.com</a></li>
              <li><a href="tel:+17789004775">+1 (778) 900-4775</a></li>
              <li>Vancouver, BC, Canada</li>
              <li><Link href="/help">Help center</Link></li>
              <li><Link href="/trust">Trust center</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__bot">
          <span>© 2026 PAWai, Inc. PAWai is not a substitute for emergency veterinary care.</span>
          <span>Made with 🐾 for animals everywhere</span>
        </div>
      </div>
    </footer>
  );
}
