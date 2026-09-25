import type { Tier } from '@/lib/careJourney';
import { TIER_META } from '@/lib/careJourney';

export type FindingTone = 'detected' | 'concern' | 'positive';

export interface CinemaHistoryItem {
  time: string;
  label: string;
}

export interface CinemaFinding {
  label: string;
  detail: string;
  tone: FindingTone;
}

export interface CinemaKnowledge {
  slug: string;
  title: string;
  blurb: string;
}

export interface CinemaClinic {
  name: string;
  slot: string;
}

/** One timed beat in a cinema story. State is cumulative across beats. */
export interface CinemaBeat {
  /** Hold time at 1× before the next beat (ms). */
  durationMs: number;
  /** Short stage caption / PAWai line. */
  caption?: string;
  /** Update triage thermometer + aria-live urgency. */
  tier?: Tier;
  /** Append pet-history timeline rows. */
  historyAdd?: CinemaHistoryItem[];
  /** Append live findings chips. */
  findingsAdd?: CinemaFinding[];
  /** Slide in a linked research card. */
  knowledge?: CinemaKnowledge;
  /** Calm home-care / next-step plan (Milo). */
  plan?: string[];
  /** Show fictional clinic booking. */
  clinic?: CinemaClinic;
  /** Animate packet flight to the clinic. */
  packetSend?: boolean;
  /** Reveal vet-ready summary + disclaimer. */
  showSummary?: boolean;
}

export interface CinemaStory {
  id: 'luna' | 'milo' | 'max';
  petName: string;
  patientLine: string;
  icon: string;
  title: string;
  complaint: string;
  /** Recommended action line on the summary card. */
  summaryAction: string;
  beats: CinemaBeat[];
}

/** Pause after the packet beat before rotating to the next story (like LOOP_DELAY). */
export const CINEMA_LOOP_DELAY_MS = 7000;

export const TIER_FILL: Record<Tier, number> = {
  routine: 22,
  sameday: 48,
  urgent: 72,
  emergency: 100,
};

export { TIER_META };

export const DEMO_STORIES: CinemaStory[] = [
  {
    id: 'luna',
    petName: 'Luna',
    patientLine: 'Luna — Dog — 7 years — Spayed Female — Labrador mix',
    icon: '🦴',
    title: 'Park fall / limp',
    complaint: 'Limping after a stumble at the park; reduced weight-bearing on the right hind leg.',
    summaryAction:
      'Same-day orthopedic check recommended. Share this packet with Northside Vet so they see history, mobility notes, and relevant research before Luna arrives.',
    beats: [
      {
        durationMs: 2800,
        caption: 'Luna stumbled at the park and is limping on her right hind leg.',
        tier: 'routine',
        findingsAdd: [
          { label: 'Presenting', detail: 'Right hind limp after park stumble', tone: 'detected' },
        ],
      },
      {
        durationMs: 2600,
        caption: 'She is still putting a little weight on it — not non-weight-bearing.',
        tier: 'sameday',
        findingsAdd: [
          { label: 'Weight-bearing', detail: 'Partial — favors the leg', tone: 'concern' },
        ],
      },
      {
        durationMs: 3200,
        caption: 'PAWai pulls Luna’s history: joint stiffness notes and gradual weight gain.',
        historyAdd: [
          { time: '14 mo ago', label: 'Stiffness after long walks noted' },
          { time: '8 mo ago', label: 'Body condition drifting upward' },
          { time: '3 mo ago', label: 'Hesitation before jumping into the car' },
          { time: 'Today', label: 'Park stumble → limp' },
        ],
        findingsAdd: [
          { label: 'History', detail: 'Prior joint / mobility signals on file', tone: 'concern' },
        ],
      },
      {
        durationMs: 3800,
        caption: 'Related evidence: early osteoarthritis changes are easy for owners to miss.',
        tier: 'urgent',
        knowledge: {
          slug: 'early-osteoarthritis-detection-in-dogs',
          title: 'Early osteoarthritis in young dogs',
          blurb:
            'A 2024 study found radiographic signs of OA in nearly 40% of young dogs screened — and owners noticed in only about 30% of confirmed cases.',
        },
      },
      {
        durationMs: 3000,
        caption: 'Booking a same-day slot at Northside Vet and packing a clinic-ready record.',
        clinic: { name: 'Northside Vet', slot: 'Today · 4:40 PM' },
        showSummary: true,
      },
      {
        durationMs: CINEMA_LOOP_DELAY_MS,
        caption: 'Packet on its way — history, triage, and research linked for the clinic.',
        packetSend: true,
      },
    ],
  },
  {
    id: 'milo',
    petName: 'Milo',
    patientLine: 'Milo — Dog — 3 years — Neutered Male — Beagle',
    icon: '🤢',
    title: 'Mild routine vomiting',
    complaint: 'Two mild vomiting episodes overnight; otherwise bright, drinking, and interested in food.',
    summaryAction:
      'Watch at home with a calm plan. Optional follow-up if vomiting returns or energy drops — PAWai does not escalate every mild episode.',
    beats: [
      {
        durationMs: 2800,
        caption: 'Milo vomited twice overnight — mostly undigested food. He seems otherwise fine.',
        tier: 'routine',
        findingsAdd: [
          { label: 'Vomiting', detail: '2 mild episodes, food character', tone: 'detected' },
          { label: 'Energy', detail: 'Bright and responsive', tone: 'positive' },
        ],
      },
      {
        durationMs: 3000,
        caption: 'Temperature stays routine. Food history shows a new treat yesterday — no red flags.',
        historyAdd: [
          { time: 'Yesterday', label: 'New soft treat introduced' },
          { time: 'Last night', label: 'Vomited undigested food ×2' },
          { time: 'This morning', label: 'Drank water; sniffed breakfast' },
        ],
        findingsAdd: [
          { label: 'Hydration', detail: 'Water intake normal', tone: 'positive' },
          { label: 'Appetite', detail: 'Interest in food present', tone: 'positive' },
        ],
        knowledge: {
          slug: 'canine-obesity-environment-behaviour',
          title: 'Obesity risk beyond the food bowl',
          blurb:
            'Environment and behaviour shape how dogs respond to treats and routines — useful context when logging diet changes for your vet.',
        },
      },
      {
        durationMs: 3600,
        caption: 'Calm home plan — no emergency escalation for this mild, watch-level story.',
        plan: [
          'Withhold food for a short rest window, then offer a bland meal if your vet agrees it fits Milo.',
          'Keep water available; watch for repeated vomiting, lethargy, or refusal to drink.',
          'Optional: message Northside Vet for a non-urgent follow-up if symptoms return.',
        ],
        showSummary: true,
      },
      {
        durationMs: CINEMA_LOOP_DELAY_MS,
        caption: 'Optional packet ready if you want the clinic to see the overnight notes.',
        clinic: { name: 'Northside Vet', slot: 'Optional follow-up · open' },
        packetSend: true,
      },
    ],
  },
  {
    id: 'max',
    petName: 'Max',
    patientLine: 'Max — Dog — 5 years — Neutered Male — French Bulldog',
    icon: '🌡️',
    title: 'Heat-related illness',
    complaint: 'Heavy panting and weakness after midday exertion on a warm day; gums look darker than usual.',
    summaryAction:
      'Seek emergency veterinary care now. This packet flags heat-related illness signals and relevant evidence for the receiving clinic.',
    beats: [
      {
        durationMs: 2400,
        caption: 'Max came back from a warm midday walk panting hard and reluctant to stand.',
        tier: 'urgent',
        findingsAdd: [
          { label: 'Breathing', detail: 'Heavy panting after exertion', tone: 'concern' },
        ],
      },
      {
        durationMs: 2200,
        caption: 'Gums look darker; energy is crashing. Triage shoots to emergency.',
        tier: 'emergency',
        findingsAdd: [
          { label: 'Gum color', detail: 'Darker than baseline — concerning', tone: 'concern' },
          { label: 'Energy', detail: 'Marked weakness', tone: 'concern' },
        ],
        historyAdd: [
          { time: 'Today, noon', label: 'Walk in warm weather' },
          { time: 'Today, 12:25', label: 'Heavy panting, won’t settle' },
          { time: 'Today, 12:40', label: 'Weakness; darker gums noted' },
        ],
      },
      {
        durationMs: 3600,
        caption: 'Evidence check: exertion — not just hot cars — drives most heat illness events.',
        knowledge: {
          slug: 'heat-related-illness-triggers-in-dogs',
          title: 'What actually triggers heatstroke in dogs',
          blurb:
            'In a study of 905,543 UK dogs, exercise triggered 74.2% of heat-related illness events — far more than vehicle confinement.',
        },
      },
      {
        durationMs: 2800,
        caption: 'Urgent clinic packet — Northside Vet ER — so they see the timeline before Max arrives.',
        clinic: { name: 'Northside Vet · ER', slot: 'Emergency · now' },
        showSummary: true,
      },
      {
        durationMs: CINEMA_LOOP_DELAY_MS,
        caption: 'Emergency packet sent. Move Max to a cool place and get to care now.',
        packetSend: true,
      },
    ],
  },
];

export function storyIndexById(id: string): number {
  const i = DEMO_STORIES.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}
