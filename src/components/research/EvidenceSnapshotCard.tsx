import type { EvidenceLevel } from '@/lib/research';

const EVIDENCE_BADGE_CLASS: Record<EvidenceLevel, string> = {
  High: 'evidence-badge evidence-badge--high',
  Moderate: 'evidence-badge evidence-badge--moderate',
  Low: 'evidence-badge evidence-badge--low',
  'Very Low': 'evidence-badge evidence-badge--very-low',
};

export interface EvidenceSnapshotCardProps {
  topic: string;
  evidenceLevel: EvidenceLevel;
  sourceJournal: string;
  sourceYear: number;
  studyType: string;
  paWaiUse: string[];
  /** Full metadata (Last Reviewed, Next Scheduled Review, Topic/Knowledge Version) is only shown when compact is false. */
  compact?: boolean;
  topicVersion?: string;
  /** Pre-formatted date label (e.g. "June 26, 2026") — format with formatPublishedDate in the server component, not here, so this stays import-free of Node's fs/path. */
  lastReviewedLabel?: string;
  nextScheduledReviewLabel?: string;
  knowledgeVersion?: string;
}

export default function EvidenceSnapshotCard({
  topic,
  evidenceLevel,
  sourceJournal,
  sourceYear,
  studyType,
  paWaiUse,
  compact = false,
  topicVersion,
  lastReviewedLabel,
  nextScheduledReviewLabel,
  knowledgeVersion,
}: EvidenceSnapshotCardProps) {
  return (
    <div className={`evidence-card${compact ? ' evidence-card--compact' : ''}`}>
      <div className="evidence-card__hd">
        <span className="evidence-card__topic">{topic}</span>
        <span className={EVIDENCE_BADGE_CLASS[evidenceLevel]}>{evidenceLevel} evidence</span>
      </div>
      <dl className="evidence-card__rows">
        <div className="evidence-card__row">
          <dt>Source</dt>
          <dd>{sourceJournal}, {sourceYear}</dd>
        </div>
        <div className="evidence-card__row">
          <dt>Study type</dt>
          <dd>{studyType}</dd>
        </div>
        <div className="evidence-card__row">
          <dt>PAWai use</dt>
          <dd className="evidence-card__chips">
            {paWaiUse.map((use) => (
              <span key={use} className="blog-tag">{use}</span>
            ))}
          </dd>
        </div>
        {!compact && (
          <>
            {lastReviewedLabel && (
              <div className="evidence-card__row">
                <dt>Last reviewed</dt>
                <dd>{lastReviewedLabel}</dd>
              </div>
            )}
            {nextScheduledReviewLabel && (
              <div className="evidence-card__row">
                <dt>Next scheduled review</dt>
                <dd>{nextScheduledReviewLabel}</dd>
              </div>
            )}
            {(topicVersion || knowledgeVersion) && (
              <div className="evidence-card__row">
                <dt>Version</dt>
                <dd>
                  {topicVersion && `Topic v${topicVersion}`}
                  {topicVersion && knowledgeVersion && ' · '}
                  {knowledgeVersion && `Knowledge v${knowledgeVersion}`}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>
      <div className="evidence-card__decision">
        ⚠ Not for decision-making — for education and visit preparation only
      </div>
    </div>
  );
}
