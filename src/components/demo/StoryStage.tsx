'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { CinemaFinding, CinemaHistoryItem, CinemaStory } from '@/lib/demoCinema';
import type { Tier } from '@/lib/careJourney';
import { TIER_META } from '@/lib/careJourney';
import Thermometer from './Thermometer';
import KnowledgePop from './KnowledgePop';
import PacketFlight from './PacketFlight';
import type { CinemaKnowledge, CinemaClinic } from '@/lib/demoCinema';

const TONE_ICON: Record<CinemaFinding['tone'], string> = {
  detected: '◇',
  concern: '▲',
  positive: '✓',
};

export interface StageState {
  tier: Tier;
  caption: string;
  history: CinemaHistoryItem[];
  findings: CinemaFinding[];
  knowledge: CinemaKnowledge | null;
  plan: string[] | null;
  clinic: CinemaClinic | null;
  packetSend: boolean;
  showSummary: boolean;
}

export default function StoryStage({
  story,
  state,
  reduceMotion,
}: {
  story: CinemaStory;
  state: StageState;
  reduceMotion: boolean;
}) {
  return (
    <div className="cinema-stage">
      <div className="cinema-stage__main">
        <header className="cinema-stage__patient">
          <span className="cinema-stage__icon" aria-hidden="true">{story.icon}</span>
          <div>
            <h3 className="cinema-stage__pet">{story.petName}</h3>
            <p className="cinema-stage__line">{story.patientLine}</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.p
            key={state.caption}
            className="cinema-stage__caption"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
          >
            {state.caption || '…'}
          </motion.p>
        </AnimatePresence>

        <div className="cinema-stage__grid">
          <Thermometer tier={state.tier} reduceMotion={reduceMotion} />

          <div className="cinema-panels">
            <div className="findings">
              <div className="findings__hd">
                <span>Live findings</span>
                {state.findings.length > 0 && (
                  <span className="findings__live">
                    <span className="findings__live-dot" aria-hidden="true" />
                    reading…
                  </span>
                )}
              </div>
              {state.findings.length === 0 ? (
                <p className="findings__empty">Findings appear as the story unfolds.</p>
              ) : (
                <ul className="findings__list" aria-live="polite">
                  <AnimatePresence initial={false}>
                    {state.findings.map((f, i) => (
                      <motion.li
                        key={`${f.label}-${i}`}
                        className={`findings__item findings__item--${f.tone}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
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

            <div className="ctimeline">
              <div className="ctimeline__hd">Pet history</div>
              {state.history.length === 0 ? (
                <p className="findings__empty">History timeline builds as PAWai recalls prior notes.</p>
              ) : (
                <ul className="ctimeline__list">
                  <AnimatePresence initial={false}>
                    {state.history.map((h, i) => (
                      <motion.li
                        key={`${h.time}-${i}`}
                        className="ctimeline__item"
                        initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.35, delay: Math.min(i * 0.05, 0.25) }
                        }
                      >
                        <span className="ctimeline__dot" aria-hidden="true" />
                        <span className="ctimeline__time">{h.time}</span>
                        <span className="ctimeline__label">{h.label}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </div>

        {state.plan && state.plan.length > 0 && (
          <div className="cinema-plan" aria-label="Calm home plan">
            <div className="cinema-plan__hd">Calm home plan</div>
            <ul>
              {state.plan.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {state.clinic && (
          <div className="cinema-clinic" role="status">
            <span className="cinema-clinic__label">Clinic</span>
            <strong>{state.clinic.name}</strong>
            <span className="cinema-clinic__slot">{state.clinic.slot}</span>
          </div>
        )}

        {state.showSummary && (
          <div className="vsummary cinema-summary">
            <div className="vsummary__hd">Vet-ready summary</div>
            <div className="vsummary__row">
              <span>Patient</span>
              <p>{story.patientLine}</p>
            </div>
            <div className="vsummary__row">
              <span>Presenting complaint</span>
              <p>{story.complaint}</p>
            </div>
            <div className="vsummary__row">
              <span>Urgency</span>
              <p>{TIER_META[state.tier].label}</p>
            </div>
            <div className="vsummary__row vsummary__row--action">
              <span>Recommended action</span>
              <p>{story.summaryAction}</p>
            </div>
            <p className="vsummary__disclaimer">
              PAWai organizes information for peace of mind and a clearer vet visit. PAWai does not
              diagnose or prescribe. Final medical decisions are always made by licensed veterinarians.
            </p>
          </div>
        )}

        <PacketFlight
          clinicName={state.clinic?.name ?? 'Northside Vet'}
          active={state.packetSend}
          reduceMotion={reduceMotion}
        />
      </div>

      <div className="cinema-stage__aside">
        {state.knowledge ? (
          <KnowledgePop card={state.knowledge} reduceMotion={reduceMotion} />
        ) : (
          <div className="cinema-know cinema-know--empty">
            <div className="cinema-know__eyebrow">Research card</div>
            <p className="findings__empty">
              When history or urgency connects to published evidence, a live research card slides in
              here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
