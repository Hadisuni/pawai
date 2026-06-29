import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getAllResearch,
  getResearchBySlug,
  getAdjacentResearch,
  getRelatedResearch,
} from '@/lib/research';
import { getEvidenceRecord } from '@/lib/evidence';
import { formatPublishedDate } from '@/lib/blog';
import EvidenceSnapshotCard from '@/components/research/EvidenceSnapshotCard';
import RelatedResearch from '@/components/research/RelatedResearch';
import { SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return getAllResearch().map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = getResearchBySlug(slug);
  if (!insight) return {};

  const url = `${SITE_URL}/research/${insight.slug}`;

  return {
    title: insight.metaTitle,
    description: insight.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: insight.metaTitle,
      description: insight.metaDescription,
      url,
      publishedTime: insight.publishedAt,
      modifiedTime: insight.updatedAt ?? insight.publishedAt,
      authors: [insight.author],
      tags: insight.tags,
    },
    twitter: {
      card: 'summary',
      title: insight.metaTitle,
      description: insight.metaDescription,
    },
  };
}

export default async function ResearchInsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = getEvidenceRecord(slug);
  if (!record) notFound();
  const { research: insight, knowledge } = record;

  const { prev, next } = getAdjacentResearch(slug);
  const related = getRelatedResearch(insight);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: insight.title,
    description: insight.metaDescription,
    datePublished: insight.publishedAt,
    dateModified: insight.updatedAt ?? insight.publishedAt,
    author: { '@type': 'Organization', name: insight.author },
    publisher: {
      '@type': 'Organization',
      name: 'PAWai',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/research/${insight.slug}` },
    keywords: insight.tags.join(', '),
    about: insight.topic,
    citation: insight.doi ? `https://doi.org/${insight.doi}` : undefined,
  };

  return (
    <article className="sec blog-article" aria-labelledby="research-article-h1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="wrap blog-article__wrap">
        <Link href="/research" className="blog-article__back" data-r>← Back to Research</Link>

        <div data-r data-d="1">
          <span className="ey"><span className="dot" aria-hidden="true" />{insight.topic}</span>
        </div>
        <h1 id="research-article-h1" data-r data-d="2">{insight.title}</h1>
        {insight.subtitle && (
          <p style={{ fontSize: '1.05rem', color: 'var(--tx2)', lineHeight: 1.7, marginTop: 10 }} data-r data-d="2">
            {insight.subtitle}
          </p>
        )}
        <p className="blog-article__meta" data-r data-d="2">
          {insight.author} · {formatPublishedDate(insight.publishedAt)} · {insight.readingTimeMinutes} min read
        </p>

        {insight.tags.length > 0 && (
          <div className="blog-article__tags" data-r data-d="2">
            {insight.tags.map((tag) => (
              <span key={tag} className="blog-tag">{tag}</span>
            ))}
          </div>
        )}

        <div style={{ margin: '8px 0 36px' }} data-r data-d="3">
          <EvidenceSnapshotCard
            topic={insight.topic}
            evidenceLevel={insight.evidenceLevel}
            sourceJournal={insight.sourceJournal}
            sourceYear={insight.sourceYear}
            studyType={insight.studyType}
            paWaiUse={insight.paWaiUse}
            topicVersion={insight.topicVersion}
            lastReviewedLabel={formatPublishedDate(insight.lastReviewed)}
            nextScheduledReviewLabel={insight.nextScheduledReview ? formatPublishedDate(insight.nextScheduledReview) : undefined}
            knowledgeVersion={knowledge?.knowledgeVersion}
          />
        </div>

        <div className="blog-article__body" data-r data-d="3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
              ),
            }}
          >
            {insight.content}
          </ReactMarkdown>
        </div>

        {insight.faqs.length > 0 && (
          <div className="blog-article__sources" data-r>
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {insight.faqs.map((faq) => (
                <details key={faq.question} className="faq-item">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {insight.sources.length > 0 && (
          <div className="blog-article__sources" data-r>
            <h2>Sources</h2>
            <ul>
              {insight.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(prev || next) && (
          <nav className="blog-article__pager" aria-label="Research article navigation">
            {prev ? (
              <Link href={`/research/${prev.slug}`} className="blog-article__pager-link blog-article__pager-link--prev">
                <span>← Previous</span>
                <strong>{prev.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/research/${next.slug}`} className="blog-article__pager-link blog-article__pager-link--next">
                <span>Next →</span>
                <strong>{next.title}</strong>
              </Link>
            ) : <span />}
          </nav>
        )}

        <RelatedResearch
          items={related.map((r) => ({ slug: r.slug, title: r.title, excerpt: r.excerpt, topic: r.topic }))}
        />
      </div>
    </article>
  );
}
