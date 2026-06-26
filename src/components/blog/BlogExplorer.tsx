'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface BlogCardData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAtLabel: string;
  readingTimeMinutes: number;
}

export default function BlogExplorer({ posts, categories }: { posts: BlogCardData[]; categories: string[] }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = !activeCategory || post.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [posts, query, activeCategory]);

  return (
    <>
      <div className="blog-filters">
        <input
          type="search"
          className="blog-search"
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search Knowledge Hub articles"
        />
        <div className="blog-filters__cats" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`blog-filter-pill${activeCategory === null ? ' is-active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`blog-filter-pill${activeCategory === category ? ' is-active' : ''}`}
              onClick={() => setActiveCategory((prev) => (prev === category ? null : category))}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="blog-empty">No articles match yet — try a different search or category.</p>
      ) : (
        <div className="blog__grid">
          {filtered.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card" data-r data-d={String(Math.min(i + 1, 5))}>
              <span className="blog-card__cat">{post.category}</span>
              <h2 className="blog-card__title">{post.title}</h2>
              <p className="blog-card__excerpt">{post.excerpt}</p>
              <span className="blog-card__date">
                {post.author} · {post.publishedAtLabel} · {post.readingTimeMinutes} min read
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
