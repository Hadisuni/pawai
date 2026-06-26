import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug, formatPublishedDate, type Span } from '@/lib/blog';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
  };
}

function renderSpans(spans: Span[]) {
  return spans.map((span, i) =>
    span.href ? (
      <a key={i} href={span.href} target="_blank" rel="noopener noreferrer">
        {span.text}
      </a>
    ) : span.bold ? (
      <strong key={i}>{span.text}</strong>
    ) : (
      <span key={i}>{span.text}</span>
    )
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="sec blog-article" aria-labelledby="blog-article-h1">
      <div className="wrap blog-article__wrap">
        <Link href="/blog" className="blog-article__back" data-r>← Back to all articles</Link>

        <div data-r data-d="1">
          <span className="ey"><span className="dot" aria-hidden="true" />{post.category}</span>
        </div>
        <h1 id="blog-article-h1" data-r data-d="2">{post.title}</h1>
        <p className="blog-article__meta" data-r data-d="2">{formatPublishedDate(post.publishedAt)}</p>

        <div className="blog-article__body" data-r data-d="3">
          {post.blocks.map((block, i) => {
            if (block.type === 'heading') {
              return block.level === 2 ? <h2 key={i}>{block.text}</h2> : <h3 key={i}>{block.text}</h3>;
            }
            if (block.type === 'list') {
              return (
                <ul key={i}>
                  {block.items.map((item, j) => (
                    <li key={j}>{renderSpans(item)}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{renderSpans(block.spans)}</p>;
          })}
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
      </div>
    </article>
  );
}
