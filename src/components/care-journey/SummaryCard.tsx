'use client';

import { motion } from 'framer-motion';
import { personalize, type Branch, type Tier } from '@/lib/careJourney';

interface SummaryCardProps {
  branch: Branch;
  picks: string[];
  tier: Tier;
  patientLine: string;
  petName: string;
}

export default function SummaryCard({ branch, picks, tier, patientLine, petName }: SummaryCardProps) {
  return (
    <motion.div
      className="vsummary"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="vsummary__hd">✅ Vet-Ready Summary</div>

      <div className="vsummary__row">
        <span>Patient</span>
        <p>{patientLine}</p>
      </div>
      <div className="vsummary__row">
        <span>Presenting Complaint</span>
        <p>{branch.summary.complaint}</p>
      </div>
      <div className="vsummary__row">
        <span>History Summary</span>
        {branch.summary.historyTemplate(picks).map((line, i) => <p key={i}>{line}</p>)}
      </div>
      <div className="vsummary__row vsummary__row--action">
        <span>Recommended Action</span>
        <p>{personalize(branch.summary.action(tier), petName)}</p>
      </div>

      <p className="vsummary__disclaimer">
        PAWai organizes information. PAWai does not diagnose. Final medical decisions are always made by licensed veterinarians.
      </p>
    </motion.div>
  );
}
