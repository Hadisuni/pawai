'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import EvidenceSnapshotCard, { type EvidenceSnapshotCardProps } from './EvidenceSnapshotCard';

export interface ResearchCardData extends Omit<EvidenceSnapshotCardProps, 'compact'> {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
}

export default function ResearchExplorer({ insights, tags }: { insights: ResearchCardData[]; tags: string[] }) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return insights.filter((insight) => {
      const matchesTag = !activeTag || insight.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!q) return true;
      return (
        insight.title.toLowerCase().includes(q) ||
        insight.excerpt.toLowerCase().includes(q) ||
        insight.topic.toLowerCase().includes(q) ||
        insight.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [insights, query, activeTag]);

  return (
    <>
      <div className="blog-filters">
        <input
          type="search"
          className="blog-search"
          placeholder="Search research insights…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search Research insights"
        />
        <div className="blog-filters__cats" role="group" aria-label="Filter by tag">
          <button
            type="button"
            className={`blog-filter-pill${activeTag === null ? ' is-active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`blog-filter-pill${activeTag === tag ? ' is-active' : ''}`}
              onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="blog-empty">No research insights match yet — try a different search or tag.</p>
      ) : (
        <div className="blog__grid">
          {filtered.map((insight, i) => (
            <Link
              key={insight.slug}
              href={`/research/${insight.slug}`}
              className="blog-card"
              data-r
              data-d={String(Math.min(i + 1, 5))}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <h2 className="blog-card__title">{insight.title}</h2>
                <p className="blog-card__excerpt">{insight.excerpt}</p>
              </div>
              <EvidenceSnapshotCard
                topic={insight.topic}
                evidenceLevel={insight.evidenceLevel}
                sourceJournal={insight.sourceJournal}
                sourceYear={insight.sourceYear}
                studyType={insight.studyType}
                paWaiUse={insight.paWaiUse}
                compact
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
