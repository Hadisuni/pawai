'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineEvent } from '@/lib/careJourney';

export default function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="ctimeline">
      <div className="ctimeline__hd">Timeline</div>
      <ol className="ctimeline__list">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              className="ctimeline__item"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              layout
            >
              <span className="ctimeline__dot" aria-hidden="true" />
              <span className="ctimeline__time">{e.time}</span>
              <span className="ctimeline__label">{e.label}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
