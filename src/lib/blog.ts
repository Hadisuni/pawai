export interface Span {
  text: string;
  bold?: boolean;
  href?: string;
}

export type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; spans: Span[] }
  | { type: 'list'; items: Span[][] };

export interface Source {
  title: string;
  url: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  keywords: string[];
  publishedAt: string;
  excerpt: string;
  blocks: Block[];
  sources: Source[];
}

function p(...spans: Span[]): Block {
  return { type: 'paragraph', spans };
}
function h(level: 2 | 3, text: string): Block {
  return { type: 'heading', level, text };
}
function t(text: string): Span {
  return { text };
}
function b(text: string): Span {
  return { text, bold: true };
}
function link(text: string, href: string): Span {
  return { text, href };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-prepare-for-a-vet-visit',
    title: 'Why Preparing Before a Vet Visit Helps Everyone — Owner, Pet, and Veterinarian',
    metaTitle: 'How to Prepare for a Vet Visit: A Complete Owner’s Guide | PAWai',
    metaDescription:
      'Learn why structured preparation before a veterinary visit improves diagnosis, saves clinical time, and reduces owner stress — with a practical checklist you can use today.',
    category: 'Pet Health Guides',
    keywords: [
      'prepare for vet visit',
      'veterinary appointment checklist',
      'pet medical history',
      'how to talk to your vet',
      'vet visit preparation',
    ],
    publishedAt: '2026-06-26',
    excerpt:
      'A complete, well-timed history can be as diagnostically valuable as the physical exam itself. Here’s what’s genuinely worth preparing before your next veterinary visit.',
    blocks: [
      p(
        t(
          'Every veterinary visit actually starts before the exam room — in the car, in the waiting room, or days earlier when a pet owner first notices something has changed. How well that moment is captured and communicated has a measurable effect on what happens next: how quickly a veterinarian can narrow down what’s going on, how much of the appointment goes toward useful diagnostic work instead of reconstructing a timeline, and how confident an owner feels walking out the door.'
        )
      ),
      p(
        t(
          'This isn’t a minor logistical detail. It’s one of the most consistently emphasized points in veterinary clinical literature: history-taking is a core part of diagnosis, not a formality that precedes it.'
        )
      ),
      h(2, 'Why History-Taking Matters Clinically'),
      p(
        t(
          'According to veterinary clinical guidance, a thorough history is one of the primary tools a veterinarian uses to determine what’s wrong — often alongside the physical exam, each informing the other. A veterinarian’s questions during a history aren’t small talk; they’re targeted, built to rule things in or out. A dog that’s lethargic and vomiting might prompt a question about whether anything in the household — like antifreeze — was recently used or changed, because that detail can immediately reshape the entire diagnostic direction ('
        ),
        link('dvm360, "The Importance of History Taking"', 'https://www.dvm360.com/view/the-importance-of-history-taking'),
        t(').')
      ),
      p(
        t(
          'The practical effect of a complete, accurate history is straightforward: it saves time that would otherwise go into reconstructing what happened, lets the clinical team move into actual diagnosis and treatment sooner, and — as veterinary sources note — demonstrates to the client that the team is being thorough and attentive ('
        ),
        link(
          'dvm360, "Getting the Best Medical History From Your Clients"',
          'https://www.dvm360.com/view/lets-talk-about-it-getting-best-medical-history-your-clients-proceedings'
        ),
        t(').')
      ),
      p(t('In other words: better information at the start of a visit isn’t just convenient. It changes how the visit unfolds.')),
      h(2, 'What "Prepared" Actually Looks Like'),
      p(
        t(
          'Veterinary preparation guides converge on a fairly consistent picture of what’s genuinely useful to bring or have ready. It breaks down into a few categories:'
        )
      ),
      h(3, '1. Patient profile and medical history'),
      p(
        t(
          'Species, breed, age, microchip number, vaccination history (including any past reactions), prior medical conditions, surgical history, allergies, and current medications — including parasite prevention products.'
        )
      ),
      h(3, '2. Lifestyle and environment'),
      p(
        t(
          'Diet and feeding schedule, exercise habits, other pets in the household, environmental exposures, recent travel, and any behavioral concerns or handling sensitivities.'
        )
      ),
      h(3, '3. Documents'),
      p(
        t(
          'Prior medical and vaccine records, and any recent lab reports or imaging — these help a veterinarian see what’s already changed and avoid repeating tests unnecessarily.'
        )
      ),
      h(3, '4. Current medications'),
      p(
        t(
          'A precise list of medicines and supplements, exact doses, and when the last dose was given — including topical or over-the-counter products. This detail specifically helps prevent dangerous drug interactions and dosing errors.'
        )
      ),
      h(3, '5. The current concern, with a timeline'),
      p(t('When it started, how it’s changed, and how severe it seems — described as specifically as possible rather than generally.')),
      h(3, '6. Photos or short videos'),
      p(
        t(
          'For things like a limp, a skin issue, or unusual behavior, a short video is often genuinely more useful to a veterinarian than a verbal description, since some symptoms are intermittent or hard to put into words.'
        )
      ),
      p(
        t('Source guidance compiled from '),
        link('Zoetis Petcare’s Vet Visit Checklist', 'https://www.zoetispetcare.com/resources/vet-checklist'),
        t(', '),
        link('Ellicott Vets’ Vet Visit Checklist', 'https://www.ellicottvets.com/vet-visit-checklist-prepare-questions/'),
        t(', and '),
        link('co.vet’s veterinary patient history templates', 'https://co.vet/post/veterinary-patient-history-template/'),
        t('.')
      ),
      h(2, 'Why This Is Hard to Do Well, in the Moment'),
      p(
        t(
          'None of this is complicated in principle. In practice, it’s genuinely difficult to do well under stress. A pet owner who’s worried tends to remember details out of order, underestimate how long something has been going on, or simply forget to mention something that turns out to matter. That’s not a failure of attention — it’s a normal response to concern about an animal you care about.'
        )
      ),
      p(t('This is precisely the gap that structured intake tools — including PAWai — are built to help close.')),
      h(2, 'Where PAWai Fits'),
      p(
        t(
          'PAWai is designed around exactly this moment: between noticing something and walking into a veterinary appointment. When a pet owner describes a concern, PAWai asks the kind of follow-up questions a careful history-taking process would ask — when it started, how it’s changed, what else has been observed alongside it — and organizes the answers into a clear, structured summary.'
        )
      ),
      p(
        b('It’s worth being precise about what that does and doesn’t mean. PAWai does not diagnose conditions, and it does not recommend treatment.'),
        t(
          ' It does not replace a veterinarian’s clinical judgment, and it isn’t built to. What it does is help an owner arrive at a visit with a clearer, more complete account of what’s actually been happening — the same kind of information that veterinary sources consistently identify as the foundation of a good clinical visit.'
        )
      ),
      p(
        t(
          'The goal isn’t to make the veterinary visit shorter for its own sake. It’s to make sure the time spent in that visit goes toward the parts that genuinely require a veterinarian — interpretation, examination, clinical decision-making — rather than toward reconstructing a timeline that could have been captured beforehand.'
        )
      ),
      h(2, 'A Simple Way to Start'),
      p(
        t(
          'If you’re getting ready for an upcoming visit, a useful exercise is to write down, in order, what you noticed and when — even just a few lines. Note any change in eating, drinking, energy, or bathroom habits. If there’s a physical symptom, a 15-second video is often worth more than a paragraph of description. And if your pet is on any medication or supplement, write down the exact name and dose rather than relying on memory in the room.'
        )
      ),
      p(
        t(
          'None of this requires special tools. It requires structure — and that structure is exactly what tends to get lost when an owner is worried. That’s the specific, narrow problem PAWai was built to help with.'
        )
      ),
      h(2, 'Conclusion'),
      p(
        t(
          'Good veterinary outcomes start well before the exam table. The clinical literature is consistent on this point: a complete, well-organized history is one of the most powerful diagnostic tools available, and it’s something every pet owner can actively contribute to — not through expertise, but through preparation. Whether that preparation happens with a notebook, a checklist, or a tool like PAWai, the underlying principle is the same: clearer information, given earlier, helps everyone in the room do their job better.'
        )
      ),
    ],
    sources: [
      { title: 'The Importance of History Taking — dvm360', url: 'https://www.dvm360.com/view/the-importance-of-history-taking' },
      {
        title: 'Getting the Best Medical History From Your Clients — dvm360',
        url: 'https://www.dvm360.com/view/lets-talk-about-it-getting-best-medical-history-your-clients-proceedings',
      },
      { title: 'Vet Visit Prep Checklist — Zoetis Petcare', url: 'https://www.zoetispetcare.com/resources/vet-checklist' },
      { title: 'Vet Visit Checklist — Ellicott Vets', url: 'https://www.ellicottvets.com/vet-visit-checklist-prepare-questions/' },
      { title: 'Veterinary Patient History Templates — co.vet', url: 'https://co.vet/post/veterinary-patient-history-template/' },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

// publishedAt is a plain "YYYY-MM-DD" date with no time component. Formatting
// it in the reader's local timezone (the default for toLocaleDateString) can
// shift it back a day whenever the local offset is behind UTC, so this pins
// formatting to UTC instead.
export function formatPublishedDate(publishedAt: string): string {
  return new Date(`${publishedAt}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
