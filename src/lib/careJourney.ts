export type Tier = 'routine' | 'sameday' | 'urgent' | 'emergency';

// All scenario content below is authored around a fictional default pet
// named "Max". `personalize` substitutes the real pet's name in at render
// time, so every line of dialogue — questions, intros, recommended actions —
// only needs to be written once.
export const DEFAULT_PET = 'Max';

export function personalize(text: string, petName: string) {
  return petName === DEFAULT_PET ? text : text.replace(new RegExp(`\\b${DEFAULT_PET}\\b`, 'g'), petName);
}

export interface Finding {
  id: string;
  label: string;
  detail: string;
  tone: 'detected' | 'concern' | 'positive';
}

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
}

export interface StepOption {
  label: string;
  points: number;
  finding?: Omit<Finding, 'id'>;
  timeline?: Omit<TimelineEvent, 'id'>;
}

export interface Step {
  id: string;
  question: string;
  options: StepOption[];
}

export interface Branch {
  id: string;
  label: string;
  icon: string;
  patientLine: string;
  intro: string;
  minTier: Tier;
  steps: Step[];
  summary: {
    complaint: string;
    historyTemplate: (picks: string[]) => string[];
    action: (tier: Tier) => string;
  };
}

export const TIER_META: Record<Tier, { label: string; short: string }> = {
  routine: { label: 'Routine', short: 'Routine' },
  sameday: { label: 'Same-day visit recommended', short: 'Same-day' },
  urgent: { label: 'Urgent assessment recommended', short: 'Urgent' },
  emergency: { label: 'Seek emergency veterinary care immediately', short: 'Emergency' },
};

export function tierFromScore(points: number, minTier: Tier): Tier {
  const order: Tier[] = ['routine', 'sameday', 'urgent', 'emergency'];
  let computed: Tier = 'routine';
  if (points >= 9) computed = 'emergency';
  else if (points >= 6) computed = 'urgent';
  else if (points >= 3) computed = 'sameday';
  return order[Math.max(order.indexOf(computed), order.indexOf(minTier))];
}

export const BRANCHES: Branch[] = [
  {
    id: 'vomiting',
    label: 'Vomiting',
    icon: '🤢',
    patientLine: 'Max has been vomiting since last night.',
    intro: "Thanks, I understand Max has been vomiting since last night. I'd like to ask a few more questions to help the vet.",
    minTier: 'routine',
    steps: [
      {
        id: 'last-normal',
        question: 'When was the last time Max was completely normal?',
        options: [
          { label: 'Yesterday afternoon', points: 1, timeline: { time: 'Yesterday, 4:00 PM', label: 'Last normal' } },
          { label: 'This morning', points: 0, timeline: { time: 'This morning', label: 'Last normal' } },
        ],
      },
      {
        id: 'vomit-count',
        question: 'How many times has he vomited in the last 24 hours?',
        options: [
          { label: 'A couple of times', points: 1, finding: { label: 'Vomiting', detail: '2 episodes reported', tone: 'detected' } },
          { label: 'Five or six times', points: 3, finding: { label: 'Vomiting', detail: '5–6 episodes reported', tone: 'concern' }, timeline: { time: 'Overnight', label: 'Multiple vomiting episodes' } },
        ],
      },
      {
        id: 'vomit-look',
        question: 'What did the vomit look like?',
        options: [
          { label: 'Mostly food', points: 0, finding: { label: 'Vomit character', detail: 'Undigested food', tone: 'detected' } },
          { label: 'Yellow liquid, no food', points: 2, finding: { label: 'Vomit character', detail: 'Yellow bile, empty stomach', tone: 'concern' } },
        ],
      },
      {
        id: 'appetite',
        question: 'Has he eaten or shown any interest in food today?',
        options: [
          { label: 'He ate a little', points: 1, finding: { label: 'Appetite', detail: 'Reduced but present', tone: 'concern' } },
          { label: "He's refused all food", points: 3, finding: { label: 'Appetite', detail: 'Refusing all food', tone: 'concern' }, timeline: { time: 'Today', label: 'Stopped eating' } },
        ],
      },
      {
        id: 'water',
        question: 'Is he drinking water normally, or does he seem off?',
        options: [
          { label: 'Drinking normally', points: 0, finding: { label: 'Hydration', detail: 'Water intake normal', tone: 'positive' } },
          { label: 'Barely drinking', points: 3, finding: { label: 'Hydration', detail: 'Water intake reduced — dehydration risk', tone: 'concern' } },
        ],
      },
      {
        id: 'energy',
        question: 'Does he seem tired or low energy?',
        options: [
          { label: 'A little quieter than usual', points: 1, finding: { label: 'Energy', detail: 'Mildly subdued', tone: 'concern' } },
          { label: "Very lethargic, won't get up", points: 4, finding: { label: 'Energy', detail: 'Marked lethargy', tone: 'concern' }, timeline: { time: 'Today', label: 'Became lethargic' } },
        ],
      },
      {
        id: 'diarrhea',
        question: 'Any diarrhea alongside the vomiting?',
        options: [
          { label: 'No diarrhea', points: 0, finding: { label: 'Stool', detail: 'No diarrhea reported', tone: 'positive' } },
          { label: 'Yes, some diarrhea too', points: 2, finding: { label: 'Stool', detail: 'Diarrhea reported alongside vomiting', tone: 'concern' } },
        ],
      },
      {
        id: 'exposure',
        question: 'Has he eaten anything unusual recently — trash, a new food, a toy?',
        options: [
          { label: 'Not that I know of', points: 0 },
          { label: 'He got into the trash this weekend', points: 2, finding: { label: 'Exposure risk', detail: 'Possible dietary indiscretion', tone: 'concern' } },
        ],
      },
    ],
    summary: {
      complaint: 'Vomiting for approximately 14 hours, reduced appetite.',
      historyTemplate: (p) => [
        `${p[1] ?? 'Several'} episodes of vomiting.`,
        `${p[2] ?? 'Vomit character noted'}.`,
        `Appetite: ${p[3]?.toLowerCase() ?? 'reduced'}.`,
        `Hydration: ${p[4]?.toLowerCase() ?? 'unclear'}.`,
        `Energy: ${p[5]?.toLowerCase() ?? 'reduced'}.`,
      ],
      action: (tier) =>
        tier === 'emergency'
          ? 'Seek emergency veterinary care immediately.'
          : 'Contact your veterinarian today. If vomiting continues or Max becomes weaker, seek emergency care immediately.',
    },
  },
  {
    id: 'limping',
    label: 'Limping',
    icon: '🦴',
    patientLine: 'Max has been limping on one leg.',
    intro: "Thanks, I understand Max has been limping. Let's narrow down what's going on.",
    minTier: 'routine',
    steps: [
      {
        id: 'leg',
        question: 'Which leg seems to be affected?',
        options: [
          { label: 'Front leg', points: 1, finding: { label: 'Location', detail: 'Front leg', tone: 'detected' } },
          { label: 'Back leg', points: 1, finding: { label: 'Location', detail: 'Back leg', tone: 'detected' } },
        ],
      },
      {
        id: 'weight',
        question: 'Is he putting any weight on it at all?',
        options: [
          { label: 'A little weight', points: 1, finding: { label: 'Weight-bearing', detail: 'Partial weight-bearing', tone: 'concern' } },
          { label: "None — won't touch the ground", points: 4, finding: { label: 'Weight-bearing', detail: 'Non weight-bearing', tone: 'concern' }, timeline: { time: 'Today', label: 'Non weight-bearing noted' } },
        ],
      },
      {
        id: 'onset',
        question: 'When did you first notice the limp?',
        options: [
          { label: 'Today', points: 1, timeline: { time: 'Today', label: 'Limp first noticed' } },
          { label: 'A couple of days ago', points: 2, timeline: { time: '2 days ago', label: 'Limp first noticed' } },
        ],
      },
      {
        id: 'trigger',
        question: 'Did anything happen beforehand — a jump, a fall, rough play?',
        options: [
          { label: 'Nothing that I saw', points: 0 },
          { label: 'Yes, he jumped off the couch', points: 1, finding: { label: 'Trigger', detail: 'Jump/fall preceded onset', tone: 'detected' } },
        ],
      },
      {
        id: 'pain',
        question: 'Does he seem painful when you touch the leg?',
        options: [
          { label: "Doesn't seem to mind", points: 0, finding: { label: 'Pain response', detail: 'No pain on palpation', tone: 'positive' } },
          { label: 'Flinches or pulls away', points: 3, finding: { label: 'Pain response', detail: 'Pain on palpation', tone: 'concern' } },
        ],
      },
      {
        id: 'swelling',
        question: 'Any swelling or visible injury?',
        options: [
          { label: 'Nothing visible', points: 0 },
          { label: 'Some swelling', points: 2, finding: { label: 'Swelling', detail: 'Visible swelling reported', tone: 'concern' } },
        ],
      },
    ],
    summary: {
      complaint: 'Limping with reduced weight-bearing on the affected leg.',
      historyTemplate: (p) => [
        `Affected limb: ${p[0]?.toLowerCase() ?? 'unspecified'}.`,
        `Weight-bearing: ${p[1]?.toLowerCase() ?? 'reduced'}.`,
        `Onset: ${p[2]?.toLowerCase() ?? 'recent'}.`,
        `Pain on palpation: ${p[4]?.toLowerCase() ?? 'unclear'}.`,
      ],
      action: (tier) =>
        tier === 'emergency'
          ? 'Seek emergency veterinary care immediately.'
          : 'Contact your veterinarian for an orthopedic assessment, especially if he remains non weight-bearing.',
    },
  },
  {
    id: 'ear',
    label: 'Ear & Skin',
    icon: '👂',
    patientLine: "Max has been scratching at his ear.",
    intro: "Thanks, I understand Max has been scratching at his ear. Let's get a clearer picture.",
    minTier: 'routine',
    steps: [
      {
        id: 'side',
        question: 'Which ear is bothering him — or both?',
        options: [
          { label: 'Just one ear', points: 0, finding: { label: 'Location', detail: 'Unilateral', tone: 'detected' } },
          { label: 'Both ears', points: 1, finding: { label: 'Location', detail: 'Bilateral', tone: 'detected' } },
        ],
      },
      {
        id: 'discharge',
        question: 'Is there any odor or discharge from the ear?',
        options: [
          { label: 'No odor', points: 0, finding: { label: 'Discharge', detail: 'None reported', tone: 'positive' } },
          { label: 'Yes, a noticeable smell or discharge', points: 3, finding: { label: 'Discharge', detail: 'Odor/discharge present — infection likely', tone: 'concern' } },
        ],
      },
      {
        id: 'duration',
        question: 'How long has this been going on?',
        options: [
          { label: 'Just today', points: 1, timeline: { time: 'Today', label: 'Scratching started' } },
          { label: 'Several days now', points: 2, timeline: { time: 'Several days ago', label: 'Scratching started' } },
        ],
      },
      {
        id: 'tilt',
        question: 'Does he shake his head a lot or tilt it to one side?',
        options: [
          { label: 'Not really', points: 0 },
          { label: 'Yes, frequently', points: 3, finding: { label: 'Head tilt', detail: 'Frequent shaking/tilt — possible inner ear involvement', tone: 'concern' } },
        ],
      },
      {
        id: 'redness',
        question: 'Any redness or swelling you can see?',
        options: [
          { label: 'Looks normal', points: 0 },
          { label: 'Looks red and irritated', points: 2, finding: { label: 'Skin', detail: 'Redness/irritation visible', tone: 'concern' } },
        ],
      },
    ],
    summary: {
      complaint: 'Ear scratching with possible discharge and discomfort.',
      historyTemplate: (p) => [
        `Ear(s) affected: ${p[0]?.toLowerCase() ?? 'unspecified'}.`,
        `Discharge/odor: ${p[1]?.toLowerCase() ?? 'unclear'}.`,
        `Duration: ${p[2]?.toLowerCase() ?? 'unclear'}.`,
        `Head shaking/tilt: ${p[3]?.toLowerCase() ?? 'none reported'}.`,
      ],
      action: () => 'Contact your veterinarian for an ear exam — likely treatable, but best confirmed in person.',
    },
  },
  {
    id: 'breathing',
    label: 'Difficulty Breathing',
    icon: '😮‍💨',
    patientLine: 'Max is having trouble breathing.',
    intro: "I understand Max is having trouble breathing — this can be urgent, so let's move quickly.",
    minTier: 'urgent',
    steps: [
      {
        id: 'ongoing',
        question: 'Is he struggling to breathe right now, or did it pass?',
        options: [
          { label: 'He seems okay right now', points: 2, finding: { label: 'Breathing', detail: 'Episode resolved for now', tone: 'concern' } },
          { label: "Yes, it's ongoing right now", points: 6, finding: { label: 'Breathing', detail: 'Active respiratory distress', tone: 'concern' }, timeline: { time: 'Right now', label: 'Active breathing difficulty' } },
        ],
      },
      {
        id: 'gums',
        question: 'Are his gums a normal pink color, or do they look pale, blue, or grey?',
        options: [
          { label: 'Normal pink', points: 0, finding: { label: 'Gum color', detail: 'Normal pink', tone: 'positive' } },
          { label: 'Pale, blue, or grey', points: 8, finding: { label: 'Gum color', detail: 'Pale/blue/grey — possible cyanosis', tone: 'concern' } },
        ],
      },
      {
        id: 'collapse',
        question: 'Has he collapsed or seemed extremely weak?',
        options: [
          { label: 'No', points: 0 },
          { label: 'Yes', points: 5, finding: { label: 'Collapse', detail: 'Collapse or extreme weakness reported', tone: 'concern' }, timeline: { time: 'Today', label: 'Collapse / extreme weakness' } },
        ],
      },
      {
        id: 'choking',
        question: 'Any recent choking, coughing, or access to something he could have inhaled or swallowed?',
        options: [
          { label: 'Not that I know of', points: 0 },
          { label: 'Yes, possibly', points: 3, finding: { label: 'Exposure risk', detail: 'Possible inhaled/swallowed object', tone: 'concern' } },
        ],
      },
    ],
    summary: {
      complaint: 'Acute difficulty breathing.',
      historyTemplate: (p) => [
        `Breathing difficulty: ${p[0]?.toLowerCase() ?? 'reported'}.`,
        `Gum color: ${p[1]?.toLowerCase() ?? 'unclear'}.`,
        `Collapse/weakness: ${p[2]?.toLowerCase() ?? 'none reported'}.`,
      ],
      action: () => 'Seek emergency veterinary care immediately — difficulty breathing can become life-threatening quickly.',
    },
  },
];

export function getBranch(id: string): Branch | undefined {
  return BRANCHES.find((b) => b.id === id);
}
