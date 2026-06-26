import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, formatPublishedDate } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'PAWai Blog — Pet Health, Veterinary AI & Care Guides',
  description:
    'Educational guides on pet health, preventive care, breed knowledge, and how AI is changing the conversation between pet owners and veterinary teams.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts().slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <section className="sec blog" aria-labelledby="blog-h1">
      <div className="wrap">
        <div className="sec__hd">
          <div data-r>
            <span className="ey"><span className="dot" aria-hidden="true" />PAWai Blog</span>
          </div>
          <h1 id="blog-h1" data-r data-d="1">Pet health, explained clearly.</h1>
          <p data-r data-d="2">
            Educational guides for pet owners — and a look at how PAWai supports, never replaces, your veterinary team.
          </p>
        </div>

        <div className="blog__grid">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
              data-r
              data-d={String(Math.min(i + 1, 5))}
            >
              <span className="blog-card__cat">{post.category}</span>
              <h2 className="blog-card__title">{post.title}</h2>
              <p className="blog-card__excerpt">{post.excerpt}</p>
              <span className="blog-card__date">{formatPublishedDate(post.publishedAt)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
