import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getAllPosts,
  getPostBySlug,
  getAdjacentPosts,
  getRelatedPosts,
  formatPublishedDate,
} from '@/lib/blog';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `https://pawai.it.com/blog/${post.slug}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
    },
    twitter: {
      card: post.featuredImage ? 'summary_large_image' : 'summary',
      title: post.metaTitle,
      description: post.metaDescription,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const related = getRelatedPosts(post);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'PAWai',
      logo: { '@type': 'ImageObject', url: 'https://pawai.it.com/favicon.ico' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://pawai.it.com/blog/${post.slug}` },
    keywords: post.keywords.join(', '),
    articleSection: post.category,
  };

  return (
    <article className="sec blog-article" aria-labelledby="blog-article-h1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="wrap blog-article__wrap">
        <Link href="/blog" className="blog-article__back" data-r>← Back to the Knowledge Hub</Link>

        <div data-r data-d="1">
          <span className="ey"><span className="dot" aria-hidden="true" />{post.category}</span>
        </div>
        <h1 id="blog-article-h1" data-r data-d="2">{post.title}</h1>
        <p className="blog-article__meta" data-r data-d="2">
          {post.author} · {formatPublishedDate(post.publishedAt)} · {post.readingTimeMinutes} min read
        </p>

        {post.tags.length > 0 && (
          <div className="blog-article__tags" data-r data-d="2">
            {post.tags.map((tag) => (
              <span key={tag} className="blog-tag">{tag}</span>
            ))}
          </div>
        )}

        {post.featuredImage && (
          <div className="blog-article__hero-img" data-r data-d="3">
            <Image src={post.featuredImage} alt={post.title} width={760} height={420} />
          </div>
        )}

        <div className="blog-article__body" data-r data-d="3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="blog-article__disclaimer" data-r>
          PAWai organizes information and educates pet owners. PAWai does not diagnose conditions or recommend treatment.
          Always consult a licensed veterinarian for medical decisions about your pet.
        </div>

        {post.sources.length > 0 && (
          <div className="blog-article__sources" data-r>
            <h2>Sources</h2>
            <ul>
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(prev || next) && (
          <nav className="blog-article__pager" aria-label="Article navigation">
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="blog-article__pager-link blog-article__pager-link--prev">
                <span>← Previous</span>
                <strong>{prev.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/blog/${next.slug}`} className="blog-article__pager-link blog-article__pager-link--next">
                <span>Next →</span>
                <strong>{next.title}</strong>
              </Link>
            ) : <span />}
          </nav>
        )}

        {related.length > 0 && (
          <div className="blog-article__related" data-r>
            <h2>Related articles</h2>
            <div className="blog__grid">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="blog-card">
                  <span className="blog-card__cat">{r.category}</span>
                  <h3 className="blog-card__title">{r.title}</h3>
                  <p className="blog-card__excerpt">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
