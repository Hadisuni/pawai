import Link from 'next/link';
import type { EvidenceLevel } from '@/lib/research';

const EVIDENCE_BADGE_CLASS: Record<EvidenceLevel, string> = {
  High: 'evidence-badge evidence-badge--high',
  Moderate: 'evidence-badge evidence-badge--moderate',
  Low: 'evidence-badge evidence-badge--low',
  'Very Low': 'evidence-badge evidence-badge--very-low',
};

export interface RecentEvidenceCardProps {
  slug: string;
  homepageTitle: string;
  homepageBlurb: string;
  evidenceLevel: EvidenceLevel;
}

export default function RecentEvidenceCard({ slug, homepageTitle, homepageBlurb, evidenceLevel }: RecentEvidenceCardProps) {
  return (
    <Link href={`/research/${slug}`} className="recent-evidence__card" data-r data-tilt>
      <div className="recent-evidence__eyebrow">Recent evidence reviewed</div>
      <h3 className="recent-evidence__title">{homepageTitle}</h3>
      <p className="recent-evidence__excerpt">{homepageBlurb}</p>
      <div className="recent-evidence__meta">
        <span className="recent-evidence__reviewed">Reviewed by PAWai Knowledge Engine</span>
        <span className={EVIDENCE_BADGE_CLASS[evidenceLevel]}>Evidence Level: {evidenceLevel}</span>
      </div>
    </Link>
  );
}
