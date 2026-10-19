'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CinemaKnowledge } from '@/lib/demoCinema';

export default function KnowledgePop({
  card,
  reduceMotion,
}: {
  card: CinemaKnowledge;
  reduceMotion: boolean;
}) {
  return (
    <motion.aside
      className="cinema-know"
      initial={reduceMotion ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Related research"
    >
      <div className="cinema-know__eyebrow">Research card</div>
      <h3 className="cinema-know__title">{card.title}</h3>
      <p className="cinema-know__blurb">{card.blurb}</p>
      <Link href={`/research/${card.slug}`} className="cinema-know__link">
        Open /research/{card.slug} →
      </Link>
      <p className="cinema-know__note">Educational only — not a diagnosis.</p>
    </motion.aside>
  );
}
