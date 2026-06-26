import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// The permanent Knowledge Hub category list. Keep this list in sync with any
// new categories introduced in article frontmatter — generateStaticParams
// and the category filter UI both read from here.
export const BLOG_CATEGORIES = [
  'AI in Veterinary Medicine',
  'Pet Health Guides',
  'Breed Library',
  'Nutrition',
  'Behavior',
  'Preventive Care',
  'Emergency Signs',
  'PAWai Updates',
  'Research',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogSource {
  title: string;
  url: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  featuredImage?: string;
  keywords: string[];
  sources: BlogSource[];
  content: string;
  readingTimeMinutes: number;
  wordCount: number;
}

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const WORDS_PER_MINUTE = 200;

function readingTimeFor(content: string): { minutes: number; words: number } {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), words };
}

let cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (cache) return cache;

  const files = fs.existsSync(CONTENT_DIR) ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')) : [];

  const posts = files.map((filename): BlogPost => {
    const slug = filename.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);
    const { minutes, words } = readingTimeFor(content);

    return {
      slug,
      title: data.title,
      metaTitle: data.metaTitle ?? data.title,
      metaDescription: data.metaDescription ?? data.excerpt ?? '',
      excerpt: data.excerpt ?? '',
      category: data.category ?? 'Pet Health Guides',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author ?? 'PAWai Team',
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt,
      featuredImage: data.featuredImage,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      content: content.trim(),
      readingTimeMinutes: minutes,
      wordCount: words,
    };
  });

  cache = posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return cache;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function getAdjacentPosts(slug: string): { prev: BlogPost | null; next: BlogPost | null } {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { prev: null, next: null };
  // posts[] is newest-first, so "next" (chronologically newer) is the
  // previous array index and "prev" (older) is the next array index.
  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const others = getAllPosts().filter((p) => p.slug !== post.slug);

  const scored = others.map((candidate) => {
    let score = 0;
    if (candidate.category === post.category) score += 2;
    score += candidate.tags.filter((tag) => post.tags.includes(tag)).length;
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt))
    .slice(0, limit)
    .map((s) => s.candidate);
}

export function getAllCategories(): string[] {
  const used = new Set(getAllPosts().map((post) => post.category));
  return BLOG_CATEGORIES.filter((category) => used.has(category));
}

// publishedAt/updatedAt are plain "YYYY-MM-DD" dates with no time component.
// Formatting in the reader's local timezone (toLocaleDateString's default)
// can shift the date back a day whenever the local offset is behind UTC, so
// this pins formatting to UTC instead.
export function formatPublishedDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
