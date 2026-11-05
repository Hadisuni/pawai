import { describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactNode } from 'react';

// Pins a post's featuredImage so these tests don't depend on content: none
// unless a test sets one.
const featured = vi.hoisted(() => ({ image: undefined as string | undefined }));

vi.mock('@/lib/blog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/blog')>();
  return {
    ...actual,
    getPostBySlug: (slug: string) => {
      const post = actual.getPostBySlug(slug);
      return post && { ...post, featuredImage: featured.image };
    },
  };
});

// next/font/google only works under Next's compiler, and the root layout calls
// it at module scope.
vi.mock('next/font/google', () => {
  const font = () => ({ className: '', variable: '', style: { fontFamily: '' } });
  return { Fredoka: font, Nunito: font };
});

import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { metadata as rootMetadata } from '@/app/layout';
import BlogPostPage, { generateMetadata as blogMetadata } from '@/app/blog/[slug]/page';
import ResearchInsightPage, { generateMetadata as researchMetadata } from '@/app/research/[slug]/page';
import OpenGraphImage from '@/app/opengraph-image';
import { GET as getLogo } from '@/app/pawai-logo-512.png/route';
import { DEFAULT_OG_IMAGE } from '@/lib/site';

const WWW = 'https://www.pawai.it.com';
const POST = 'dog-hind-leg-limp-comes-and-goes-cruciate';
const RESEARCH = 'cruciate-ligament-rupture-in-dogs';

// The first render pays for Satori/resvg WASM and font setup (~2.5 s on a
// busy machine), so image tests get more than vitest's 5 s default.
const IMAGE_RENDER_TIMEOUT_MS = 20_000;

const routeProps = (slug: string) => ({ params: Promise.resolve({ slug }) });

interface ScriptProps {
  type?: string;
  children?: ReactNode;
  dangerouslySetInnerHTML?: { __html: string };
}

// Walks the element tree a page returns (no rendering) to the JSON-LD script.
function findJsonLd(node: ReactNode): unknown {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findJsonLd(child);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement<ScriptProps>(node)) return undefined;
  const { type, children, dangerouslySetInnerHTML } = node.props;
  if (node.type === 'script' && type === 'application/ld+json' && dangerouslySetInnerHTML) {
    return JSON.parse(dangerouslySetInnerHTML.__html);
  }
  return findJsonLd(children);
}

// Width and height live in the PNG IHDR chunk, right after the 8-byte signature.
async function pngSize(response: Response): Promise<{ width: number; height: number }> {
  const view = new DataView(await response.arrayBuffer());
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe('canonical host', () => {
  it('lists every sitemap URL on www, the host Vercel serves', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => !url.startsWith(`${WWW}/`))).toEqual([]);
  });

  it('points robots.txt at the www sitemap', () => {
    expect(robots().sitemap).toBe(`${WWW}/sitemap.xml`);
  });
});

describe('root social metadata', () => {
  // Every page without its own openGraph inherits these. A title, description
  // or fixed url here would stamp the home page's onto all of them; Next fills
  // title/description per page and './' resolves to each page's own path.
  it('leaves og/twitter title and description to each page', () => {
    expect(rootMetadata.openGraph).toMatchObject({ type: 'website', siteName: 'PAWai', url: './' });
    expect(rootMetadata.openGraph).not.toHaveProperty('title');
    expect(rootMetadata.openGraph).not.toHaveProperty('description');
    expect(rootMetadata.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(rootMetadata.twitter).not.toHaveProperty('title');
    expect(rootMetadata.twitter).not.toHaveProperty('description');
  });
});

describe('post social metadata', () => {
  it('gives a blog post without a featured image the default large card', async () => {
    const meta = await blogMetadata(routeProps(POST));

    expect(meta.alternates?.canonical).toBe(`${WWW}/blog/${POST}`);
    expect(meta.openGraph).toMatchObject({
      url: `${WWW}/blog/${POST}`,
      siteName: 'PAWai',
      images: [DEFAULT_OG_IMAGE],
    });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: [DEFAULT_OG_IMAGE] });
  });

  it("uses a blog post's featured image instead of the default card", async () => {
    featured.image = '/images/blog/hero.jpg';
    try {
      const meta = await blogMetadata(routeProps(POST));

      expect(meta.openGraph).toMatchObject({ images: [{ url: '/images/blog/hero.jpg' }] });
      expect(meta.twitter).toMatchObject({
        card: 'summary_large_image',
        images: [{ url: '/images/blog/hero.jpg' }],
      });
    } finally {
      featured.image = undefined;
    }
  });

  it('gives a research post the default large card on www', async () => {
    const meta = await researchMetadata(routeProps(RESEARCH));

    expect(meta.alternates?.canonical).toBe(`${WWW}/research/${RESEARCH}`);
    expect(meta.openGraph).toMatchObject({
      url: `${WWW}/research/${RESEARCH}`,
      siteName: 'PAWai',
      images: [DEFAULT_OG_IMAGE],
    });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: [DEFAULT_OG_IMAGE] });
  });
});

describe('JSON-LD publisher logo', () => {
  const logo = { '@type': 'ImageObject', url: `${WWW}/pawai-logo-512.png`, width: 512, height: 512 };

  it('names the square PNG logo on blog posts', async () => {
    const jsonLd = findJsonLd(await BlogPostPage(routeProps(POST)));

    expect(jsonLd).toMatchObject({
      publisher: { name: 'PAWai', logo },
      mainEntityOfPage: { '@id': `${WWW}/blog/${POST}` },
    });
  });

  it('names the square PNG logo on research posts', async () => {
    const jsonLd = findJsonLd(await ResearchInsightPage(routeProps(RESEARCH)));

    expect(jsonLd).toMatchObject({
      publisher: { name: 'PAWai', logo },
      mainEntityOfPage: { '@id': `${WWW}/research/${RESEARCH}` },
    });
  });
});

describe('generated brand images', () => {
  it(
    'renders the default social card as a 1200x630 PNG',
    async () => {
      const response = await OpenGraphImage();

      expect(response.headers.get('content-type')).toBe('image/png');
      expect(await pngSize(response)).toEqual({ width: 1200, height: 630 });
    },
    IMAGE_RENDER_TIMEOUT_MS,
  );

  it(
    'renders the publisher logo as a 512x512 PNG',
    async () => {
      const response = getLogo();

      expect(response.headers.get('content-type')).toBe('image/png');
      expect(await pngSize(response)).toEqual({ width: 512, height: 512 });
    },
    IMAGE_RENDER_TIMEOUT_MS,
  );
});
