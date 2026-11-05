import { ImageResponse } from 'next/og';
import PawLogo from '@/components/PawLogo';
import { BRAND_COLORS } from '@/lib/brand';
import { SITE_LOGO } from '@/lib/site';

// Square brand mark for the JSON-LD publisher logo (SITE_LOGO). A plain route
// rather than app/icon.tsx, which would also become the browser favicon.
// Rendered once at build time.
export const dynamic = 'force-static';

export function GET(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: BRAND_COLORS.bg,
        }}
      >
        <PawLogo size={SITE_LOGO.width} />
      </div>
    ),
    { width: SITE_LOGO.width, height: SITE_LOGO.height },
  );
}
