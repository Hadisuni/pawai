# PAWai Phase 1 — Dashboard-First Flow Spec

**Status: DRAFT — pending Hadi's approval. No code changes until approved.**
CEO plan: `~/.gstack/projects/Hadisuni-pawai/ceo-plans/2026-07-08-dashboard-first-flow.md`
Supersedes the flow portion of `PHASE1_MVP_PLAN.md` (its honest-claims pass, email
pipeline, and storage roadmap remain valid).

## Context

PAWai's positioning is "a pet health record that talks." The current flow delivers
"a chat that emails you": Home → /welcome (2 fields) → /demo → scripted conversation
→ summary → email capture. The record is invisible, so PAWai reads as a chatbot.
This spec makes /dashboard the product surface, with the AI as an action inside it,
using only device-local storage — no database, no accounts, no fake persistence.

## Current State (verified 2026-07-08, uncommitted pivot in working tree)

| Where | What exists today |
|---|---|
| `src/components/WelcomeForm.tsx` | 2 fields (pet name + species) → localStorage `pawai_session` → router.push('/demo') |
| `src/app/demo/page.tsx` + `CareJourneyModeSwitcher.tsx` | Extra "Start the Conversation" click; showreel + driven mode share the page |
| `src/components/AICareJourney.tsx` | 4-branch scripted check; driven mode ends at summary + SaveRecordCard; fake live-call visuals (P0, being removed) |
| `src/components/care-journey/SaveRecordCard.tsx` | Email capture → POST /api/intake → n8n → Gmail (Gmail credential currently DOWN) |
| `src/app/dashboard/page.tsx` | Write-only shell; identity via `?oid=&cid=&name=&pet=` query params; unlinked, noindex |
| `src/app/dashboard/components/*` (5 sections) | Weight/Vaccination/Medication/QoL forms POST to /api/health/* (n8n, hardcoded prod webhooks); render nothing back — "No weight records yet" is hardcoded forever |
| `src/lib/session.ts` | `pawai_session` + dormant draft helpers; `useSession()` via useSyncExternalStore |
| `src/components/Header.tsx` | Get Started → /welcome. No Login link exists (correct — none should be added) |
| `src/components/SupportWidget.tsx` | Site-wide ElevenLabs corner widget = a second visible AI identity |

## Target Flow

```
Home ──Get Started──> /welcome (2-step onboarding) ──> /dashboard
                                                          │
        ┌─────────────────────────────────────────────────┤
        │ Pet Profile card          (from onboarding)     │
        │ Today's Concern / Start Health Check ──> /check │──> guided conversation
        │ Vet-Ready Summary card    (latest entry)        │    │ summary written to
        │ Health Timeline           (all entries, newest) │<───┘ local record +
        │ Wellness Signals check-in (writes entry)        │      email via intake
        │ Reminders                 (honest coming-soon)  │
        │ Ask PAWai                 (single AI entry)     │
        └─────────────────────────────────────────────────┘
Returning same-device visitor: Header shows "My Dashboard" instead of "Get Started".
No Login anywhere (none exists; email/token access is Phase 2).
```

## Open decisions (approve or override; recommendation applied if you just say "approved")

- **D1 Email in onboarding** — REC: shown in step 2, optional, with consent note;
  required only when saving/emailing a summary. Protects the worried-owner
  conversion while prefilling the save card.
- **D2 "Ask PAWai" at launch** — REC: opens the guided health check (one real mode).
  Mode chips ("General question", "Update record", "Prepare summary") ship only
  when real — no fake menu.
- **D3 /demo fate** — REC: keep as clearly-labeled interactive showreel, reachable
  from home ("View interactive demo") but out of the core flow; /check is the real
  tool surface.
- **D4 Corner ElevenLabs widget** — REC: marketing pages only (/, /about, /blog,
  /research, /help, /trust, /contact); hidden on /welcome, /dashboard, /check, /demo.
  One visible assistant per surface.

## Implementation Details

### 1. Local record store — new `src/lib/record.ts` (+ small session.ts touch)

```ts
export type EntryType = 'summary' | 'weight' | 'vaccination' | 'wellness' | 'note';
export interface RecordEntry { id: string; type: EntryType; createdAt: string; payload: Record<string, unknown>; }
// payload shapes:
//  summary: { concern: string; tier: string; text: string }
//  weight: { value: number; unit: 'kg'|'lb'; date: string; notes?: string }
//  vaccination: { vaccine: string; date: string; notes?: string }
//  wellness: { appetite: 1|2|3; energy: 1|2|3; mood: 1|2|3; notes?: string }
//  note: { text: string }
export interface OwnerInfo { name?: string; email?: string; phone?: string; location?: string; consent?: boolean; }
export interface PetProfile extends PetInfo { spayedNeutered?: string; mainConcern?: string; conditions?: string; medications?: string; vetClinic?: string; }
export interface PawRecord { version: 1; createdAt: string; owner: OwnerInfo; pet: PetProfile; entries: RecordEntry[]; }
```

- localStorage key `pawai_record`. API: `loadRecord()`, `saveRecord()`,
  `addEntry(type, payload)`, `clearRecord()`, `useRecord()`.
- `useRecord()` must re-render on same-tab writes: module-level `Set` of
  listeners + `emit()` after every write (the existing `noopSubscribe` pattern in
  session.ts only works for read-once values — do NOT reuse it for the record).
- Onboarding completion also writes the existing `pawai_session` so
  AICareJourney's driven-mode detection keeps working unchanged.
- Honest-persistence rule: every surface that mentions storage says "saved on
  this device"; email is the durability story. No "synced", no "account".

### 2. Onboarding — rewrite `src/components/WelcomeForm.tsx` (2 steps)

- **Step 1 — the pet:** name*, species* (Dog/Cat/Other), "What's going on with
  {name} today?" (optional, 1 line), then a collapsed "More details (optional)"
  group: breed, age, sex, spayed/neutered, weight, existing conditions, current
  medications, vet clinic. Only name + species block progress.
- **Step 2 — the owner:** name, email (per D1: optional), phone (optional),
  city/country (optional), consent checkbox (required only if email entered):
  "PAWai may email me my pet's summaries and record." Copy: "No account needed.
  Everything is saved on this device — email yourself copies anytime."
- Step 2 has an explicit "Skip for now →" action (risk review P1): lands on the
  dashboard with an empty owner object; email is re-asked at summary-save time.
- Submit → `saveRecord(...)` + `saveSession(...)` → `router.push('/dashboard')`.
- If a record already exists on /welcome: show "Continue to {pet}'s dashboard"
  primary + "Start over with a different pet" secondary (confirm before
  `clearRecord()` — destructive).
- `src/app/welcome/page.tssx` H1 stays "Who are we helping today?"; step 2 heading
  "And who's their human?".

### 3. Dashboard — rewrite `src/app/dashboard/page.tsx` + components

- Server wrapper keeps metadata (noindex until launch review); renders new client
  `<DashboardClient />`. Drop ALL query-param identity (`oid/cid/name/pet`).
- No record in localStorage → client-redirect to /welcome.
- Cards (order = hierarchy): 
  1. **Pet Profile** — from `record.pet`; shows the onboarding fields that were filled.
  2. **Today's Concern / Start Health Check** — primary CTA. If `pet.mainConcern`
     set: "Start a check about: {concern}". → `/check`.
  3. **Vet-Ready Summary** — latest `summary` entry rendered in full (reuse
     SummaryCard styling); empty state: "Run your first health check to build
     {pet}'s first vet-ready summary."
  4. **Health Timeline** — all entries newest-first with type icons + quick-add
     row (Weight, Vaccination, Note) using rewritten section forms that call
     `addEntry` (delete the /api/health/* fetches; instant render from store).
  5. **Wellness Signals** — 3-tap check-in (appetite/energy/mood) → `wellness` entry;
     replaces QoLSection's n8n form.
  6. **Reminders** — honest placeholder: "Coming soon — vaccination and medication
     reminders." No fake toggles.
  7. **Ask PAWai** — one assistant entry point (per D2 → /check). Copy: "Ask about
     symptoms, or update {pet}'s record — PAWai guides you."
  8. **Device privacy footer** (risk review P1): "Remove {pet}'s data from this
     device" → confirm → `clearRecord()` + `clearSession()` → home. Closes the
     shared-computer residue hole in the honest-persistence story.
- Files: `DashboardClient.tsx` (new), rewrite `WeightSection/VaccinationSection/
  QoLSection` to local-store versions, DELETE `MedicationSection.tsx` (meds live in
  profile from onboarding; ad-hoc via Note), DELETE `src/app/api/health/*` (4 routes
  with hardcoded prod webhooks — also closes env-cleanup blocker for them).

### 4. The check surface — new `src/app/check/page.tsx`

- Renders `<AICareJourney autoStart />` directly (no mode switcher), with a
  "← {pet}'s dashboard" link. noindex. No record → redirect to /welcome.
- `AICareJourney` driven mode: on entering `summary` phase, `addEntry('summary',
  { concern: branch.label, tier, text: summaryText })` (guard against duplicate
  writes on re-render; write once per completed branch).
- `SaveRecordCard`: state line "✓ Saved to {pet}'s record on this device", email
  prefilled from `record.owner.email`; button "Email me a copy". Success adds
  "Back to dashboard" link. (Honest-error work from the blocker list applies here.)
- Driven + prefers-reduced-motion: render the interactive flow without animations
  instead of the pre-baked fake transcript (current behavior would fabricate a
  conversation the user never had — unacceptable on the real tool surface).
- `/demo` (per D3): unchanged showreel via mode switcher; driven visitors are taken
  to /check from the dashboard instead. Bottom CTA on /demo stays for showreel
  viewers (entry: /welcome) — no longer circular because the core flow never
  lands users on /demo.

### 5. Navigation & identity

- `Header.tsx`: small client swap — record exists ? "My Dashboard" → /dashboard
  : "Get Started" → /welcome. No Login link (rule 3: nothing fake; email/token
  access is Phase 2 per PHASE1_MVP_PLAN §3).
- `SupportWidget.tsx` (per D4): render null on /welcome, /dashboard, /check, /demo
  (usePathname check). Also resolves the mobile overlap blocker on the save card.
- sitemap: do NOT add /dashboard or /check. Keep noindex on both.

### 6. Carried-over launch blockers (unchanged scope, ship together)

Fake live-call theater removal (stock photo → PawLogo avatar, LIVE badge, timer,
mic, "live intake call" copy), duplicate-first-question fix in `useSpeech.ts`
(once-guard + detach-before-cancel), honest errors (SaveRecordCard messages +
/api/intake returns 502 on n8n failure instead of fake success), env cleanup in
/api/intake + /api/contact (env-only, clear 503 on missing var; /api/health/*
deleted above), delete /careers + /press + sitemap entries, "© 2026 PAWai" (no
Inc.), `scroll-padding-top` for sticky-nav clipping, hide Pause/Replay/speed in
driven mode, soften home "log weight, meds and vaccinations" card to match what
is actually reachable (the dashboard now makes most of it TRUE — recheck copy
after build).

## Acceptance Criteria

1. Home → Get Started → completing step 1 (name+species only) + step 2 (all
   optional skipped) lands on /dashboard in ≤ 60s with zero server calls.
2. /dashboard with no record redirects to /welcome; with a record it renders all
   7 cards; no `oid/cid/name/pet` query params anywhere in the codebase.
3. Start Health Check → /check → completing a branch adds exactly ONE summary
   entry; it appears in Vet-Ready Summary card and Timeline immediately on return.
4. Weight quick-add renders the saved value in the Timeline without reload;
   `grep -r "api/health" src` returns nothing.
5. Email save: success only claims email when /api/intake returns 2xx; n8n
   failure shows "email service unavailable" (not "check your address"); email
   field prefilled from onboarding when provided.
6. Exactly one visible AI identity per page: `elevenlabs-convai` absent on
   /welcome, /dashboard, /check, /demo at 375px and desktop.
7. No Login control anywhere; Header shows "My Dashboard" iff record exists.
8. No fake persistence claims: the strings "account", "sync", "cloud" do not
   appear on dashboard/onboarding surfaces; "saved on this device" does.
9. Reduced-motion driven check never shows a fabricated transcript.
10. All carried-over blocker criteria (no LIVE badge/timer/mic/stock photo, no
    duplicate first bubble in a production build, no /careers /press routes, no
    "PAWai, Inc.", no clipped headings, no showreel controls in driven mode).
11. `npx tsc --noEmit` clean; `next build` succeeds; QA pass at 375px + desktop.

## Testing Plan

| Layer | What | How |
|---|---|---|
| Unit-ish | record.ts add/load/clear + listener emit | tsc + manual console in preview |
| Flow | onboarding → dashboard → check → summary → email (n8n down path included) | preview browser, both widths |
| Regression | /demo showreel unaffected; /contact form unaffected; blog/research untouched | preview spot-check |
| Build | production build + typecheck | gstack-ship step |

## Known risks accepted (from /gstack-review of this spec)

- Cross-tab staleness: `useRecord()` syncs same-tab writes only; two open tabs can
  diverge until reload. Accepted for MVP.
- EXTERNAL (check in n8n when Gmail is fixed): if any email template links to
  `/dashboard?oid=...`, those links become redirects-to-/welcome after query-param
  identity is removed. Update or drop such links in the template.
- record.ts wraps JSON.parse in try/catch (follow session.ts pattern); corrupted
  storage degrades to "no record" → /welcome, never a crash.
- Onboarding's optional phone/city are NEVER sent to /api/intake — they stay
  device-local so the privacy notice remains accurate.

## Rollback

All work stays uncommitted-on-branch until you approve commit. Recommend:
commit the current honest-claims pivot first (checkpoint), then build this on
`feat/dashboard-first`. Rollback = discard branch; localStorage schema is
versioned (`version: 1`) so later migrations are possible.

## Effort (CC + gstack)

record store ~20m · onboarding ~35m · dashboard ~60m · /check + journey wiring
~35m · nav/widget ~15m · carried-over blockers ~75m · QA/review/build ~60m
→ **~5h total** (human-team equivalent ~1.5–2 weeks).

## Out of Scope (explicit)

Database/Postgres, /record/<token>, auth or any Login UI, cross-device access,
reminders that actually fire, multi-pet, new AI modes, voice mode, clinic portal,
Research/Knowledge surfaces, deploy, Gmail credential repair (yours), n8n
workflow edits.
