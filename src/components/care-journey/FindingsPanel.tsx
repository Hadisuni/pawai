'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Finding } from '@/lib/careJourney';

const TONE_ICON: Record<Finding['tone'], string> = {
  detected: '✓',
  concern: '⚠',
  positive: '✓',
};

export default function FindingsPanel({ findings, active }: { findings: Finding[]; active: boolean }) {
  return (
    <div className="findings">
      <div className="findings__hd">
        <span>Live Analysis</span>
        {active && <span className="findings__live"><span className="findings__live-dot" aria-hidden="true" />analyzing…</span>}
      </div>
      {findings.length === 0 ? (
        <p className="findings__empty">Findings will appear here as the conversation unfolds.</p>
      ) : (
        <ul className="findings__list" aria-live="polite">
          <AnimatePresence initial={false}>
            {findings.map((f) => (
              <motion.li
                key={f.id}
                className={`findings__item findings__item--${f.tone}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                layout
              >
                <span className="findings__icon" aria-hidden="true">{TONE_ICON[f.tone]}</span>
                <span className="findings__label">{f.label}</span>
                <span className="findings__detail">{f.detail}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
