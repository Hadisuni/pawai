import type { Metadata } from 'next';
import { getAllResearch, getAllResearchTags } from '@/lib/research';
import ResearchExplorer from '@/components/research/ResearchExplorer';

export const metadata: Metadata = {
  title: 'Evidence Library — PAWai Research',
  description:
    'Veterinary research, summarized and graded for pet owners and clinics. Every insight here traces back to a real peer-reviewed paper, with its evidence level and limitations shown plainly.',
  alternates: { canonical: '/research' },
};

export default function ResearchIndexPage() {
  const insights = getAllResearch().map((insight) => ({
    slug: insight.slug,
    title: insight.title,
    excerpt: insight.excerpt,
    topic: insight.topic,
    tags: insight.tags,
    evidenceLevel: insight.evidenceLevel,
    sourceJournal: insight.sourceJournal,
    sourceYear: insight.sourceYear,
    studyType: insight.studyType,
    paWaiUse: insight.paWaiUse,
  }));
  const tags = getAllResearchTags();

  return (
    <section className="sec blog" aria-labelledby="research-h1">
      <div className="wrap">
        <div className="sec__hd">
          <div data-r>
            <span className="ey"><span className="dot" aria-hidden="true" />PAWai Evidence Library</span>
          </div>
          <h1 id="research-h1" data-r data-d="1">Evidence behind the guidance.</h1>
          <p data-r data-d="2">
            Every insight here is traced back to a real, peer-reviewed paper — with its evidence level, study type, and limitations shown plainly. None of it is for diagnosis or treatment decisions; it&apos;s here to inform you and your conversations with your veterinarian.
          </p>
        </div>

        {/* "Latest Research" is the Evidence Library's first section. Disease
            Categories and Evidence Level browsing are designed to live here
            as additional sections later — getAllResearchTopics() and
            getAllEvidenceLevels() in research.ts already expose the facets
            they'd filter on, so adding them won't require restructuring this
            page, only adding sections beside this one. */}
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.3rem', margin: '8px 0 18px', letterSpacing: '-0.01em' }} data-r>
          Latest Research
        </h2>
        <ResearchExplorer insights={insights} tags={tags} />
      </div>
    </section>
  );
}
