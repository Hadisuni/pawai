import fs from 'fs';
import path from 'path';

// The machine-readable counterpart to research.ts. Every research article
// at src/content/research/<slug>.md is expected to have a matching
// src/content/knowledge/<slug>.json — this is the canonical knowledge
// source future RAG/vector-DB/API/agent integrations should read from.
//
// Shared metadata (topic, evidenceLevel, tags, citation, etc.) lives only
// in the research frontmatter — it is never duplicated here. This file
// holds only the structured knowledge that has no human-prose equivalent:
// graph entities/relationships, atomic agent-retrievable facts, and
// clinical decision-support notes extracted from the source paper.
export type KnowledgeEntityType =
  | 'Disease'
  | 'Species'
  | 'Breed'
  | 'Symptom'
  | 'ClinicalSign'
  | 'RiskFactor'
  | 'Diagnostic'
  | 'Treatment'
  | 'Prevention'
  | 'Nutrition'
  | 'Behaviour'
  | 'EmergencyIndicator';

export interface KnowledgeEntity {
  id: string;
  type: KnowledgeEntityType;
  name: string;
}

export interface KnowledgeRelationship {
  source: string;
  relation: string;
  target: string;
  evidenceLevel: string;
}

export interface AIAgentFact {
  fact: string;
  sourcePaper: string;
  category: string;
  evidenceLevel: string;
  /** Not for decision-making, regardless of tier — see DECISION_MAKING_ELIGIBLE in research.ts. */
  usageTier: 'Educational Only' | 'Useful for Triage' | 'Clinical Support';
}

export interface ClinicalDecisionSupport {
  historyQuestions: string[];
  redFlags: string[];
  differentialDiagnosesMentioned: string[];
  recommendedDiagnosticWorkups: string[];
  urgentCareTriggers: string[];
}

export interface KnowledgeRecord {
  slug: string;
  knowledgeVersion: string;
  knowledgeGraph: {
    entities: KnowledgeEntity[];
    relationships: KnowledgeRelationship[];
  };
  aiAgentFacts: AIAgentFact[];
  clinicalDecisionSupport: ClinicalDecisionSupport;
  limitations: string[];
}

const CONTENT_DIR = path.join(process.cwd(), 'src/content/knowledge');

let cache: KnowledgeRecord[] | null = null;

export function getAllKnowledge(): KnowledgeRecord[] {
  if (cache) return cache;

  const files = fs.existsSync(CONTENT_DIR) ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')) : [];

  cache = files.map((filename): KnowledgeRecord => {
    const slug = filename.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
    const data = JSON.parse(raw);
    return { slug, ...data };
  });

  return cache;
}

export function getKnowledgeBySlug(slug: string): KnowledgeRecord | undefined {
  return getAllKnowledge().find((record) => record.slug === slug);
}
