'use client';

import { motion } from 'framer-motion';
import { TIER_META, type Tier } from '@/lib/careJourney';
import { TIER_FILL } from '@/lib/demoCinema';

const TIER_ORDER: Tier[] = ['routine', 'sameday', 'urgent', 'emergency'];

export default function Thermometer({
  tier,
  reduceMotion,
}: {
  tier: Tier;
  reduceMotion: boolean;
}) {
  const fill = TIER_FILL[tier];

  return (
    <div className="cinema-thermo" role="status" aria-live="polite" aria-atomic="true">
      <div className="cinema-thermo__hd">
        <span className="cinema-thermo__title">Triage temperature</span>
        <span className={`cinema-thermo__badge cinema-thermo__badge--${tier}`}>
          {TIER_META[tier].short}
        </span>
      </div>
      <div className="cinema-thermo__body">
        <div className="cinema-thermo__track" aria-hidden="true">
          <motion.div
            className={`cinema-thermo__fill cinema-thermo__fill--${tier}`}
            initial={false}
            animate={{ height: `${fill}%` }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </div>
        <ol className="cinema-thermo__scale">
          {TIER_ORDER.map((t) => (
            <li
              key={t}
              className={`cinema-thermo__tick${t === tier ? ' is-active' : ''}`}
              data-tier={t}
            >
              {TIER_META[t].short}
            </li>
          ))}
        </ol>
      </div>
      <p className="cinema-thermo__sr">
        Urgency now: {TIER_META[tier].label}
      </p>
    </div>
  );
}
