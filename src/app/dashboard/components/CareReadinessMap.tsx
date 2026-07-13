'use client';

import type { PetInfo } from '@/lib/session';
import type { RecordEntry } from '@/lib/record';

// The Care readiness map visualizes DATA COMPLETENESS only — how much of the
// record is filled in, never how healthy the pet is. Every label here must
// stay on the approved naming list (Record completeness, Care readiness,
// Vet-summary readiness, Wellness signals, Information strength); words like
// "diagnosis", "risk" or "health score" must never appear on this surface.

export interface ReadinessSignal {
  key: 'profile' | 'summary' | 'timeline' | 'reminders' | 'wellness';
  icon: string;
  label: string;
  /** 0..1 — share of this signal's data slots that are filled. */
  filled: number;
  /** Prompt shown when the signal has gaps; null when complete. */
  prompt: string | null;
  /** Where "quick edit" should take the user. */
  target: 'profile' | 'summary' | 'timeline' | 'reminders' | 'wellness' | 'check';
}

export interface Readiness {
  /** 0..100 — overall record completeness (filled data slots / all slots). */
  percent: number;
  signals: ReadinessSignal[];
  recentConcern: { concern: string; tier: string; createdAt: string } | null;
}

export function computeReadiness(pet: PetInfo, entries: RecordEntry[]): Readiness {
  const latestSummary = entries.find((e): e is Extract<RecordEntry, { type: 'summary' }> => e.type === 'summary');
  const hasWeight = Boolean(pet.weight) || entries.some((e) => e.type === 'weight');
  const timelineCount = entries.filter((e) => e.type !== 'reminder').length;
  const hasReminder = entries.some((e) => e.type === 'reminder');
  const hasQol = entries.some((e) => e.type === 'qol');

  // Profile detail slots beyond the onboarding basics (name/species/age/sex
  // are guaranteed by the session gate, so they aren't counted).
  const profileSlots = [Boolean(pet.breed), hasWeight, Boolean(pet.conditions), Boolean(pet.medications), Boolean(pet.vetClinic)];
  const profileFilled = profileSlots.filter(Boolean).length / profileSlots.length;

  const missingProfileBits = [
    !pet.breed && 'breed',
    !hasWeight && 'weight',
    !pet.conditions && 'conditions',
    !pet.medications && 'medications',
    !pet.vetClinic && 'vet clinic',
  ].filter((b): b is string => Boolean(b));

  const signals: ReadinessSignal[] = [
    {
      key: 'profile',
      icon: '🐾',
      label: 'Profile details',
      filled: profileFilled,
      prompt: missingProfileBits.length > 0
        ? missingProfileBits.includes('weight')
          ? 'Add weight to strengthen the record'
          : `Add ${missingProfileBits[0]} to complete the profile`
        : null,
      target: 'profile',
    },
    {
      key: 'summary',
      icon: '📄',
      label: 'Vet-summary readiness',
      filled: latestSummary ? 1 : 0,
      prompt: latestSummary ? null : 'Start a health check to generate a vet-ready summary',
      target: 'check',
    },
    {
      key: 'timeline',
      icon: '📈',
      label: 'Timeline',
      filled: Math.min(timelineCount / 3, 1),
      prompt: timelineCount < 3 ? 'Log entries to build the timeline' : null,
      target: 'timeline',
    },
    {
      key: 'reminders',
      icon: '⏰',
      label: 'Reminders',
      filled: hasReminder ? 1 : 0,
      prompt: hasReminder ? null : 'Add reminders to track ongoing care',
      target: 'reminders',
    },
    {
      key: 'wellness',
      icon: '❤️',
      label: 'Wellness signals',
      filled: hasQol ? 1 : 0,
      prompt: hasQol ? null : 'Log a wellness check-in to add wellness signals',
      target: 'wellness',
    },
  ];

  // Overall completeness: profile slots + one slot per non-profile signal.
  const slots = [...profileSlots, Boolean(latestSummary), timelineCount >= 3, hasReminder, hasQol];
  const percent = Math.round((slots.filter(Boolean).length / slots.length) * 100);

  return {
    percent,
    signals,
    recentConcern: latestSummary
      ? { concern: latestSummary.concern, tier: latestSummary.tier, createdAt: latestSummary.createdAt }
      : null,
  };
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RING_R = 96;
const NODE_ORBIT_R = 133;
const NODE_R = 21;
const RING_STROKE = 10;

function speciesEmoji(species: string): string {
  const s = species.toLowerCase();
  if (s.includes('dog')) return '🐶';
  if (s.includes('cat')) return '🐱';
  if (s.includes('bird')) return '🐦';
  if (s.includes('rabbit')) return '🐰';
  return '🐾';
}

/**
 * Orbit-style record visualization: a central ring shows Record completeness
 * (data filled in, nothing medical) and five orbiting nodes show which parts
 * of the record are strong vs. still empty. Clicking a node jumps to that
 * section — the map doubles as navigation.
 */
export default function CareReadinessMap({
  pet,
  readiness,
  onSelect,
}: {
  pet: PetInfo;
  readiness: Readiness;
  onSelect: (target: ReadinessSignal['target']) => void;
}) {
  const circumference = 2 * Math.PI * RING_R;
  const dash = (readiness.percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Record completeness: ${readiness.percent}%`}
        style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block' }}
      >
        {/* Orbit guide */}
        <circle cx={CENTER} cy={CENTER} r={NODE_ORBIT_R} fill="none" stroke="var(--border)" strokeDasharray="2 6" />
        {/* Completeness ring */}
        <circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="rgba(var(--teal-rgb), 0.12)" strokeWidth={RING_STROKE} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_R}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* Center: pet + completeness */}
        <circle cx={CENTER} cy={CENTER} r={RING_R - 14} fill="rgba(var(--teal-rgb), 0.05)" />
        <text x={CENTER} y={CENTER - 30} textAnchor="middle" fontSize="30">{speciesEmoji(pet.species)}</text>
        <text x={CENTER} y={CENTER + 8} textAnchor="middle" fontSize="34" fontWeight="800" fill="var(--tx1)" fontFamily="var(--font-b)">
          {readiness.percent}%
        </text>
        <text x={CENTER} y={CENTER + 30} textAnchor="middle" fontSize="11" fill="var(--tx3)" fontFamily="var(--font-b)" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>
          Record completeness
        </text>
        {/* Orbit signal nodes */}
        {readiness.signals.map((s, i) => {
          const angle = (-90 + i * (360 / readiness.signals.length)) * (Math.PI / 180);
          const x = CENTER + NODE_ORBIT_R * Math.cos(angle);
          const y = CENTER + NODE_ORBIT_R * Math.sin(angle);
          const complete = s.filled >= 1;
          const started = s.filled > 0;
          return (
            <g
              key={s.key}
              role="button"
              tabIndex={0}
              aria-label={`${s.label}${complete ? ' — complete' : ' — add details'}`}
              onClick={() => onSelect(s.target)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.target); } }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill={complete ? 'rgba(var(--teal-rgb), 0.16)' : 'rgba(var(--glass-rgb), 0.6)'}
                stroke={started ? 'var(--teal)' : 'var(--border-hi)'}
                strokeWidth={complete ? 2 : 1.5}
                strokeDasharray={started ? undefined : '3 4'}
              />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="15" opacity={started ? 1 : 0.55}>{s.icon}</text>
            </g>
          );
        })}
      </svg>
      <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: 4, textAlign: 'center' }}>
        More details make PAWai more useful.
      </p>
    </div>
  );
}
