import type { Metadata } from 'next';
import { getAllPosts, getAllCategories, formatPublishedDate } from '@/lib/blog';
import BlogExplorer from '@/components/blog/BlogExplorer';

export const metadata: Metadata = {
  title: 'PAWai Knowledge Hub — Pet Health, Veterinary AI & Care Guides',
  description:
    'Educational guides on pet health, preventive care, breed knowledge, and how AI is changing the conversation between pet owners and veterinary teams.',
  alternates: {
    canonical: '/blog',
    types: { 'application/rss+xml': '/blog/rss.xml' },
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    author: post.author,
    publishedAtLabel: formatPublishedDate(post.publishedAt),
    readingTimeMinutes: post.readingTimeMinutes,
  }));
  const categories = getAllCategories();

  return (
    <section className="sec blog" aria-labelledby="blog-h1">
      <div className="wrap">
        <div className="sec__hd">
          <div data-r>
            <span className="ey"><span className="dot" aria-hidden="true" />PAWai Knowledge Hub</span>
          </div>
          <h1 id="blog-h1" data-r data-d="1">Pet health, explained clearly.</h1>
          <p data-r data-d="2">
            Educational guides for pet owners and veterinary professionals — and a look at how PAWai supports, never replaces, your veterinary team.
          </p>
        </div>

        <BlogExplorer posts={posts} categories={categories} />
      </div>
    </section>
  );
}
