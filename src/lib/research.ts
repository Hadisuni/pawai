import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Mirrors blog.ts's content pipeline, extended with the PAWai Knowledge
// Engine's evidence-grading fields. Every Research Insight article carries
// its own evidence level, study type, and usage tier — these are never
// inferred at render time, only read from frontmatter set during the
// Research -> Knowledge -> Validation -> Production pipeline.
export type EvidenceLevel = 'High' | 'Moderate' | 'Low' | 'Very Low';

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchFaq {
  question: string;
  answer: string;
}

export interface ResearchInsight {
  slug: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  homepageTitle: string;
  homepageBlurb: string;
  topic: string;
  tags: string[];
  evidenceLevel: EvidenceLevel;
  studyType: string;
  sourceJournal: string;
  sourceYear: number;
  doi: string;
  paWaiUse: string[];
  topicVersion: string;
  lastReviewed: string;
  nextScheduledReview: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  sources: ResearchSource[];
  faqs: ResearchFaq[];
  content: string;
  readingTimeMinutes: number;
  wordCount: number;
}

// A hard, always-true ceiling — never read from frontmatter, never
// overridable per-article. No Research Insight is ever decision-making
// eligible, regardless of evidence level or PAWai use tier.
export const DECISION_MAKING_ELIGIBLE = false;

const CONTENT_DIR = path.join(process.cwd(), 'src/content/research');
const WORDS_PER_MINUTE = 200;

function readingTimeFor(content: string): { minutes: number; words: number } {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), words };
}

let cache: ResearchInsight[] | null = null;

export function getAllResearch(): ResearchInsight[] {
  if (cache) return cache;

  const files = fs.existsSync(CONTENT_DIR) ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')) : [];

  const insights = files.map((filename): ResearchInsight => {
    const slug = filename.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);
    const { minutes, words } = readingTimeFor(content);

    return {
      slug,
      title: data.title,
      subtitle: data.subtitle ?? '',
      metaTitle: data.metaTitle ?? data.title,
      metaDescription: data.metaDescription ?? data.excerpt ?? '',
      excerpt: data.excerpt ?? '',
      homepageTitle: data.homepageTitle ?? data.title,
      homepageBlurb: data.homepageBlurb ?? data.excerpt ?? '',
      topic: data.topic ?? 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      evidenceLevel: data.evidenceLevel ?? 'Low',
      studyType: data.studyType ?? '',
      sourceJournal: data.sourceJournal ?? '',
      sourceYear: data.sourceYear ?? 0,
      doi: data.doi ?? '',
      paWaiUse: Array.isArray(data.paWaiUse) ? data.paWaiUse : [],
      topicVersion: data.topicVersion ?? '1.0',
      lastReviewed: data.lastReviewed ?? data.publishedAt,
      nextScheduledReview: data.nextScheduledReview ?? '',
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt,
      author: data.author ?? 'PAWai Knowledge Engine',
      sources: Array.isArray(data.sources) ? data.sources : [],
      faqs: Array.isArray(data.faqs) ? data.faqs : [],
      content: content.trim(),
      readingTimeMinutes: minutes,
      wordCount: words,
    };
  });

  cache = insights.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return cache;
}

export function getResearchBySlug(slug: string): ResearchInsight | undefined {
  return getAllResearch().find((insight) => insight.slug === slug);
}

export function getAdjacentResearch(slug: string): { prev: ResearchInsight | null; next: ResearchInsight | null } {
  const insights = getAllResearch();
  const index = insights.findIndex((insight) => insight.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: insights[index + 1] ?? null,
    next: insights[index - 1] ?? null,
  };
}

export function getRelatedResearch(insight: ResearchInsight, limit = 3): ResearchInsight[] {
  const others = getAllResearch().filter((i) => i.slug !== insight.slug);

  const scored = others.map((candidate) => {
    let score = 0;
    if (candidate.topic === insight.topic) score += 2;
    score += candidate.tags.filter((tag) => insight.tags.includes(tag)).length;
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt))
    .slice(0, limit)
    .map((s) => s.candidate);
}

export function getAllResearchTags(): string[] {
  const tags = new Set<string>();
  getAllResearch().forEach((insight) => insight.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

// Facet helpers for the Evidence Library. Only "tags" has filter UI today —
// these two exist so the Evidence Level and Disease Category facets the
// Evidence Library is designed to support later can be wired up against the
// data layer without touching research.ts again.
export function getAllResearchTopics(): string[] {
  const topics = new Set<string>();
  getAllResearch().forEach((insight) => topics.add(insight.topic));
  return Array.from(topics).sort();
}

export function getAllEvidenceLevels(): EvidenceLevel[] {
  const levels = new Set<EvidenceLevel>();
  getAllResearch().forEach((insight) => levels.add(insight.evidenceLevel));
  const order: EvidenceLevel[] = ['High', 'Moderate', 'Low', 'Very Low'];
  return order.filter((level) => levels.has(level));
}
