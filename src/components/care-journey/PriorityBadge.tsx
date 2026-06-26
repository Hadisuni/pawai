'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TIER_META, type Tier } from '@/lib/careJourney';

const ICON: Record<Tier, string> = {
  routine: '●',
  sameday: '◐',
  urgent: '▲',
  emergency: '⛔',
};

export default function PriorityBadge({ tier }: { tier: Tier }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tier}
        className={`priority priority--${tier}`}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        role="status"
        aria-live="polite"
      >
        <span className="priority__icon" aria-hidden="true">{ICON[tier]}</span>
        <span className="priority__label">{TIER_META[tier].label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
