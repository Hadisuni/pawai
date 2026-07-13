import { SITE_URL } from '@/lib/site';
import { logError } from './log';

// The absolute origin used when the SERVER mints links that leave the app
// (magic-link emails, Care Card record links). Separate from SITE_URL on
// purpose: SITE_URL is the canonical production domain for SEO surfaces
// (sitemap, metadata, JSON-LD) and should stay a constant, but emailed
// links must point at the environment that generated them — a dev server
// must never hand out production URLs.
//
// Resolution order:
//  1. APP_ORIGIN env var, validated as an absolute http(s) URL;
//  2. outside production: http://localhost:<PORT|3000>;
//  3. production fallback: SITE_URL.
export function appOrigin(): string {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return url.origin;
      }
      logError('lib/origin', `APP_ORIGIN has unsupported protocol "${url.protocol}" — ignoring it`);
    } catch {
      logError('lib/origin', 'APP_ORIGIN is not a valid absolute URL — ignoring it');
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    return `http://localhost:${process.env.PORT || 3000}`;
  }
  return SITE_URL;
}
