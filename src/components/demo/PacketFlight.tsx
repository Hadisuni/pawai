'use client';

import { motion } from 'framer-motion';

export default function PacketFlight({
  clinicName,
  active,
  reduceMotion,
}: {
  clinicName: string;
  active: boolean;
  reduceMotion: boolean;
}) {
  if (!active) return null;

  return (
    <div className="cinema-packet" role="status" aria-live="polite">
      <div className="cinema-packet__rail" aria-hidden="true">
        <span className="cinema-packet__from">PAWai</span>
        <div className="cinema-packet__track">
          <motion.span
            className="cinema-packet__dot"
            initial={reduceMotion ? false : { left: '0%' }}
            animate={{ left: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 2.4, ease: [0.22, 1, 0.36, 1], repeat: Infinity, repeatDelay: 0.6 }
            }
          />
        </div>
        <span className="cinema-packet__to">{clinicName}</span>
      </div>
      <div className="cinema-packet__bar" aria-hidden="true">
        <motion.div
          className="cinema-packet__progress"
          initial={reduceMotion ? { width: '100%' } : { width: '0%' }}
          animate={{ width: '100%' }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 2.8, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
      <p className="cinema-packet__label">
        Sending vet-ready packet to <strong>{clinicName}</strong>…
      </p>
    </div>
  );
}
