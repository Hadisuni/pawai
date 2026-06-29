import { getAllResearch, getResearchBySlug, type ResearchInsight } from './research';
import { getAllKnowledge, getKnowledgeBySlug, type KnowledgeRecord } from './knowledge';

// The Evidence Engine's merge point. An EvidenceRecord is the canonical,
// always-paired view of one topic: the human-readable ResearchInsight plus
// its machine-readable KnowledgeRecord. Nothing in the app should read
// research.ts or knowledge.ts metadata separately once a topic needs both —
// read it from here so the pairing can never silently drift apart.
export interface EvidenceRecord {
  research: ResearchInsight;
  knowledge: KnowledgeRecord | null;
}

export function getEvidenceRecord(slug: string): EvidenceRecord | undefined {
  const research = getResearchBySlug(slug);
  if (!research) return undefined;
  return { research, knowledge: getKnowledgeBySlug(slug) ?? null };
}

export function getAllEvidenceRecords(): EvidenceRecord[] {
  const knowledgeBySlug = new Map(getAllKnowledge().map((k) => [k.slug, k]));
  return getAllResearch().map((research) => ({
    research,
    knowledge: knowledgeBySlug.get(research.slug) ?? null,
  }));
}

// Sync-check, not a build gate: every research article should have a
// matching knowledge file and vice versa. Surfacing the gap here (rather
// than failing silently) is what keeps "always synchronized" honest as the
// content set grows beyond one article.
export function getUnsyncedSlugs(): { missingKnowledge: string[]; orphanedKnowledge: string[] } {
  const researchSlugs = new Set(getAllResearch().map((r) => r.slug));
  const knowledgeSlugs = new Set(getAllKnowledge().map((k) => k.slug));

  return {
    missingKnowledge: Array.from(researchSlugs).filter((slug) => !knowledgeSlugs.has(slug)),
    orphanedKnowledge: Array.from(knowledgeSlugs).filter((slug) => !researchSlugs.has(slug)),
  };
}
