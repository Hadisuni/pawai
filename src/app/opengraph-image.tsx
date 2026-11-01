import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import PawLogo from '@/components/PawLogo';
import { BRAND_COLORS } from '@/lib/brand';
import { DEFAULT_OG_IMAGE, SITE_TAGLINE } from '@/lib/site';

// The site-wide social card. Next links it as og:image for every route that
// doesn't set openGraph itself; blog/research posts reference it explicitly
// through DEFAULT_OG_IMAGE.
export const alt = DEFAULT_OG_IMAGE.alt;
export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = DEFAULT_OG_IMAGE.type;

// Fredoka is the site's display face. next/og can't read next/font's WOFF2,
// so the TTF is vendored under its OFL licence (src/assets/fonts/OFL.txt).
const FONT_PATH = join(process.cwd(), 'src/assets/fonts/Fredoka-Bold.ttf');

// Break the tagline at its "+" so each clause gets its own line.
const [taglineLead, taglineTail] = SITE_TAGLINE.split(' + ');

const GLOWS = [
  'radial-gradient(circle at 6% 0%, rgba(46, 220, 168, 0.24), rgba(46, 220, 168, 0) 55%)',
  'radial-gradient(circle at 100% 100%, rgba(240, 145, 90, 0.2), rgba(240, 145, 90, 0) 50%)',
].join(', ');

export default async function OpenGraphImage() {
  const fredoka = await readFile(FONT_PATH);

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '0 96px',
          overflow: 'hidden',
          backgroundColor: BRAND_COLORS.bg,
          backgroundImage: GLOWS,
          color: BRAND_COLORS.text,
          fontFamily: 'Fredoka',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -80,
            bottom: -120,
            display: 'flex',
            opacity: 0.07,
            transform: 'rotate(-14deg)',
          }}
        >
          <PawLogo size={560} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PawLogo size={152} />
          <div style={{ display: 'flex', marginLeft: 26, fontSize: 136, letterSpacing: -2 }}>
            PAW<span style={{ color: BRAND_COLORS.teal }}>ai</span>
          </div>
        </div>

        <div
          style={{
            width: 148,
            height: 10,
            marginTop: 40,
            borderRadius: 9999,
            backgroundImage: BRAND_COLORS.highlight,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 40,
            fontSize: 64,
            lineHeight: 1.12,
            letterSpacing: -0.5,
            color: BRAND_COLORS.textMuted,
          }}
        >
          <span>{taglineLead}</span>
          {taglineTail && (
            <span style={{ display: 'flex' }}>
              <span style={{ marginRight: 18, color: BRAND_COLORS.teal }}>+</span>
              {taglineTail}
            </span>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Fredoka', data: fredoka, weight: 700, style: 'normal' }],
    },
  );
}
