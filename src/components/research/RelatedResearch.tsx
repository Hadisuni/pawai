import Link from 'next/link';

export interface RelatedResearchItem {
  slug: string;
  title: string;
  excerpt: string;
  topic: string;
}

// Tag/topic-overlap scoring lives in research.ts's getRelatedResearch — this
// component just renders whatever it's given. Swapping that scoring for a
// future embedding-based recommendation source means changing the caller,
// not this component.
export default function RelatedResearch({ items }: { items: RelatedResearchItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="blog-article__related" data-r>
      <h2>Related Research</h2>
      <div className="blog__grid">
        {items.map((item) => (
          <Link key={item.slug} href={`/research/${item.slug}`} className="blog-card">
            <span className="blog-card__cat">{item.topic}</span>
            <h3 className="blog-card__title">{item.title}</h3>
            <p className="blog-card__excerpt">{item.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
