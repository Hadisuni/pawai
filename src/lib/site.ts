// www is the host Vercel serves; the apex 308-redirects to it, so every
// canonical, og:url, sitemap and feed URL must use www to avoid pointing
// crawlers at a redirect.
export const SITE_URL = 'https://www.pawai.it.com';
export const SITE_NAME = 'PAWai';
export const SITE_TAGLINE = 'AI pet-health triage + vet-ready summary';

// Square brand mark rendered by src/app/pawai-logo-512.png/route.tsx; the
// JSON-LD publisher logo.
export const SITE_LOGO = { url: `${SITE_URL}/pawai-logo-512.png`, width: 512, height: 512 };

// The site-wide social card rendered by src/app/opengraph-image.tsx. A page
// that sets its own openGraph replaces the inherited one wholesale, images
// included, so it must list this itself when it has no image of its own.
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};
