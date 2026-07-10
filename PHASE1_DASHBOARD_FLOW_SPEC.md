# PAWai Phase 1 — Dashboard-First Flow Spec

**Status: DRAFT — awaiting Hadi's approval. No code edits until this spec is approved.**
Date: 2026-07-08 · Branch: `main` (uncommitted honest-claims pivot in working tree)
Supersedes the *core loop* section of `PHASE1_MVP_PLAN.md` (chat-first `/welcome → /demo` loop). Keeps and absorbs its honest-claims work and the triple-review launch blockers.
**Also supersedes `PHASE1_DASHBOARD_FIRST_SPEC.md`** (an earlier draft of this same pivot from a parallel session): that draft proposed "one visible AI identity"; Hadi's 2026-07-08 direction explicitly replaced it with the two-level model (public PAWai Guide + private PAWai Care Agent, §6). Its useful catches are absorbed here (§7.3: device-clear action, legacy `?oid=` links). Recommend deleting the older file on approval — Hadi's call.

---

## 1. Context and why

The current Phase-1 flow drops a new visitor from a 2-field `/welcome` straight into a full-screen scripted conversation on `/demo`. Three problems, verified in code this session:

1. **It reads as "just a chatbot"** — the product's only surface is a chat page, styled as a fake live call (stock human headset photo in `public/avatar-pawai.jpg`, LIVE badge and fake timer in `src/components/AICareJourney.tsx:346-359`).
2. **There is no product home.** The `/dashboard` built in PR #6 exists but is unlinked, uses unsafe query-param identity (`/dashboard?oid=&name=&pet=`, `src/app/dashboard/page.tsx:15-19`), and its four forms write to n8n webhooks with no read-back — nothing a user saves is ever shown back to them.
3. **The AI has no reason-to-sign-up gradient.** The site-wide ElevenLabs widget (`src/components/SupportWidget.tsx`) behaves identically for a stranger and a returning owner.

The fix: make the **living health record (dashboard) the product surface**, with AI guidance built into it, and make PAWai one system with two levels — a public guide that knows nothing personal, and a private care agent that knows the pet profile.

**Done when:** a first-time visitor can go Home → Get Started → 2-step onboarding → Dashboard → guided health check → vet-ready summary saved to a visible record → optional email copy, at 375 px and desktop, with zero fabricated claims, no fake login, no fake persistence, and the public/private AI boundary enforced.

## 2. Product model — one PAWai, two levels

```
PUBLIC SITE                            PRIVATE (after onboarding)
┌──────────────────────────┐           ┌──────────────────────────────────┐
│ Homepage / Blog / Demo   │           │ /dashboard  (the product)        │
│                          │  Get      │  ┌ Pet Profile Card              │
│  PAWai Guide (widget)    │  Started  │  ├ Today's Concern → Health Check│
│  · explains PAWai        │ ────────► │  ├ Vet-Ready Summary + email     │
│  · general pet questions │  2-step   │  ├ Health Timeline (read-back)   │
│  · NO pet context        │ onboarding│  ├ Reminders (device checklist)  │
│  · invites profile       │           │  ├ Wellness / QoL check          │
└──────────────────────────┘           │  └ PAWai Care Agent (has profile)│
                                       └──────────────────────────────────┘
```

The user-facing promise: **"PAWai gets more helpful once it knows your pet."** Same PAWai, same voice, same visual identity — the private level is the public level plus the pet's profile and record.

## 3. Naming (recommended)

| Surface | Product name | Button/entry copy |
|---|---|---|
| Public widget, site-wide | **PAWai Guide** | "Ask PAWai" |
| Dashboard module | **PAWai Care Agent** | "Ask PAWai about {Pet}" |

One brand, two levels — never "two bots." The Guide always refers to the Care Agent as "PAWai with your pet's profile," e.g.: *"I can give general guidance here. If you create your pet's profile, PAWai can use your pet's age, breed, symptoms, medications, and history to help you organize a more useful vet-ready summary."*

Rejected: "Ask PAWai" as the public product name (it's a verb phrase, better as the button); "PAWai Assistant" (generic, chatbot-flavored).

## 4. Target user flow

```
Home ──"Create your pet's free profile"──► /welcome (onboarding)
                                              step 1: pet   step 2: owner+consent
                                                        │
                                                        ▼
                                          /dashboard (session-gated, local record)
                                             │            │              │
                                    Start Health Check  Ask PAWai     forms: weight/
                                     (guided, driven)  (Care Agent)   vaccine/med/QoL
                                             │                              │
                                    Vet-Ready Summary ──auto-saved──► Health Timeline
                                             │
                                    "Email me a copy" ──► /api/intake ──► n8n ──► Gmail
```

Returning same-device visitor: header shows **"My Dashboard"** instead of "Get Started" (session detected). `/demo` stays the public self-playing showreel, clearly labeled a demo; the real driven experience lives in the dashboard.

## 5. Screen-by-screen

### 5.1 Homepage `/`
- Hero CTA (primary): **"Create your pet's free profile"** → `/welcome`. Secondary: "Watch the demo" → `/demo`.
- Keep the honest pivot copy as-is (already clean). One copy fix: the "A record that builds over time" feature card currently promises weight/med/vaccine logging with no public UI — after this build it becomes TRUE (dashboard forms), so it stays.
- PAWai Guide widget present (bottom-right), public mode.

### 5.2 `/welcome` — Owner + Pet onboarding (2 steps, one route)
Replaces the current 2-field form (`src/components/WelcomeForm.tsx`). Progress dots ("1 of 2"). Total target time < 90 seconds.

**Step 1 — the pet** (headline: "Who are we helping today?")

| Field | Required | Control | Notes |
|---|---|---|---|
| Pet name | ✔ | text | autofocus |
| Species | ✔ | select Dog/Cat/Other | default Dog |
| Breed | – | text | placeholder "Optional" |
| Age | ✔ | select: <1 / 1–3 / 4–7 / 8–12 / 13+ / Not sure | buckets beat free text |
| Sex + spay/neuter | ✔ | select: Male / Male, neutered / Female / Female, spayed / Not sure | one control, not two |
| Weight | – | text + unit | optional |

**Step 2 — the owner** (headline: "And who's looking after {Pet}?")

| Field | Required | Control | Notes |
|---|---|---|---|
| Your name | ✔ | text | |
| Email | ✔ | email | identity anchor; used only for summaries the user requests |
| Phone | – | tel, collapsed behind "Add phone (optional)" | **never required** |
| City / Country | – | text, collapsed | |
| Consent | ✔ | checkbox | exact copy in §9 |

**Not in onboarding** (progressive, collected later): main concern today (asked on the dashboard, it's the health-check entry), existing conditions, current medications, vet clinic (all "Add details" on the Pet Profile Card). This keeps onboarding at 8 visible fields, 6 required.

Submit → build `PawSession v2` in localStorage → `router.push('/dashboard')`. No server call (unchanged principle: nothing leaves the device until the user asks for an email).

### 5.3 `/dashboard` — the product surface
Session-gated client page: no session → `router.replace('/welcome')`. Stays out of `sitemap.ts`; keeps `robots: noindex`. **The unsafe `?oid=&cid=&name=&pet=` query-param identity is deleted.** No server-side user data exists on this page — everything renders from the visitor's own localStorage, which is what makes an auth-less dashboard safe.

Modules, top to bottom:

| Module | MVP behavior | Empty state copy |
|---|---|---|
| **Pet Profile Card** | Fields from onboarding + "Add details" (breed/conditions/medications/vet clinic) editing session in place | — |
| **Today's Concern / Start Health Check** | Primary CTA. Opens the guided health check (§5.4). Descriptor (R3): *"Structured questions, about 3 minutes, ends in a vet-ready summary."* | "Worried about something? Start a health check — about 3 minutes." |
| **Vet-Ready Summary** | Latest `summary` entry rendered + "Email me a copy" (SaveRecordCard, honest errors) | "Your first health check ends in a vet-ready summary. It will live here." |
| **Health Timeline** | All record entries newest-first (summaries, weight, vaccines, meds, QoL, notes) | "Every check and entry you add builds {Pet}'s story here." |
| **Reminders** | Manual local checklist (title + date). Honest label: "PAWai doesn't send notifications yet — this is your checklist." | "Add a reminder — a vaccine due date, a re-check, a medication refill." |
| **Wellness / QoL check** | Existing QoL questionnaire (`QoLSection.tsx`), score saved as a record entry, shown in timeline | "A 1-minute check-in you can repeat weekly." |
| **PAWai Care Agent** | "Ask PAWai about {Pet}" — ElevenLabs widget with profile context (§6.2, behind launch gate). Descriptor (R3): *"Open conversation — ask anything about caring for {Pet}."* Users must never confuse it with the structured health check. | — |
| **Persistence banner** (footer of page) | *"{Pet}'s record is stored on this device only. Email yourself a copy anytime — accounts that sync across devices are coming."* | always visible |

The four existing form sections (`WeightSection`, `VaccinationSection`, `MedicationSection`, `QoLSection`) are **rewired from n8n POSTs to the local record store** and immediately render what they saved (the missing read-back). The `/api/health/*` routes are deleted (they carry hardcoded production webhook fallbacks — a standing P0).

### 5.4 Guided Health Check (inside the dashboard)
The existing scripted conversation engine (`AICareJourney` driven mode, 4 branches) mounts inside `/dashboard` when the user starts a check (conditional full-width view with "← Back to record"). The summary auto-saves as a record entry, then offers the email copy. All standing honesty fixes apply here (§10): PawLogo avatar instead of the stock human photo, no LIVE badge/timer/mic, no Pause/Replay/speed controls in driven mode, duplicate-first-question fix in `useSpeech`.

Honest framing rule: this is labeled **"Guided health check"** — never presented as free-text AI chat (it is 4 scripted branches; anything else funnels badly).

### 5.5 `/demo` — public showreel
Stays as the self-playing demo for visitors without a session, relabeled explicitly: eyebrow "Interactive demo", aria-label without "live". Bottom CTA: no session → "Create your pet's free profile" (→ /welcome); with session → "Open {Pet}'s record" (→ /dashboard). This kills the circular CTA loop.

### 5.6 Header / Footer
- Header CTA becomes session-aware: no session → **Get Started** → `/welcome`; session → **My Dashboard** → `/dashboard`. (Small client component; nav links unchanged.)
- **No Login link anywhere** (§8).
- Footer: "© 2026 PAWai" (drop ", Inc."), delete `/careers` + `/press` routes and their sitemap entries (standing P1s).

## 6. The two AI surfaces

### 6.1 Public PAWai Guide (site-wide widget)
Implementation: the existing single ElevenLabs agent (`SupportWidget.tsx`), renamed in copy to PAWai Guide. **Rules enforced in the agent prompt** (config change in ElevenLabs console — Hadi dependency, exact text below):

- Explains what PAWai is and how the record works; answers general pet-care questions carefully.
- Never claims to know this visitor's pet; never gives personalized guidance; never diagnoses.
- When a question needs personal context, invites: the §3 example line.
- Never invents features; if asked about accounts/sync: "coming, not available yet."

Prompt addition (paste into the agent's system prompt):
> You are PAWai Guide, the public assistant on the PAWai website. You do NOT have access to any pet's profile or history, and you must never imply that you do. Give careful general guidance only; you never diagnose — veterinarians make medical decisions. When a question would benefit from the pet's age, breed, history, or medications, say: "I can give general guidance here. If you create your pet's profile, PAWai can use your pet's age, breed, symptoms, medications, and history to help you organize a more useful vet-ready summary — it's free and takes about a minute." Do not describe features that don't exist yet; accounts and cross-device sync are "coming, not available yet."

### 6.2 Private PAWai Care Agent (dashboard module)
Same ElevenLabs agent, second level: the dashboard mounts the widget with **dynamic variables** carrying the profile (`pet_name, species, breed, age_bucket, sex_neutered, weight, conditions, medications, main_concern, has_summary`). The agent prompt branches on `mode=care`:

**Launch gate (review finding R1):** the Care Agent module ships behind `NEXT_PUBLIC_CARE_AGENT=1` and stays hidden until the ElevenLabs prompt update is live and a real call verifies the agent actually uses the variables. If the config isn't done at launch, the dashboard launches without the module — a dashboard whose "Care Agent" doesn't know the pet would be fake personalization, the exact failure this spec exists to prevent.

**Data minimization (review finding R2):** only the pet fields above are ever passed to ElevenLabs. Owner name, email, phone, and location are NEVER sent to the agent. A one-line disclosure sits under the module: *"Voice conversations are processed by ElevenLabs to power PAWai's voice."* The trust page gets a matching sentence (today neither the trust page nor the privacy notice mentions ElevenLabs — verified 2026-07-08).

> When mode=care you are PAWai Care Agent inside {{pet_name}}'s health record. Use the provided profile to ask better questions and help the owner organize information for veterinary care: current concern, changes over time, what to tell the vet. Encourage the guided health check for a structured vet-ready summary. You support the owner and organize information; you never diagnose — veterinarians make medical decisions.

MVP boundary honesty: the Care Agent **talks with context** but does not write to the record automatically (the post-call n8n webhook writes to Sheets today, not to the device record). The record is written by the guided health check and the dashboard forms. Copy must not promise "the agent updates your record."

### 6.3 Boundary enforcement (two layers)
1. **App layer:** public pages render the widget with zero user data (verified today — no attributes passed). Only `/dashboard` passes dynamic variables. The floating public widget is **not rendered on /dashboard** (one agent instance per page; also fixes the 375 px overlap risk on the save card).
2. **Prompt layer:** the mode-branching prompt above. Public mode has no variables to leak even if the prompt fails.

## 7. Data and persistence (MVP-safe)

### 7.1 `PawSession` v2 — `src/lib/session.ts`
```ts
interface OwnerInfo { name: string; email: string; phone?: string; cityCountry?: string; consentAt: string }
interface PetInfo   { name: string; species: string; breed?: string; ageBucket?: string;
                      sexNeutered?: string; weight?: string; conditions?: string;
                      medications?: string; vetClinic?: string }
interface PawSession { sessionId: string; owner: OwnerInfo; pet: PetInfo; createdAt: string }
```
Migration: a legacy session (no `owner.email`) is treated as onboarding-incomplete → `/dashboard` redirects to `/welcome` prefilled with the known pet name/species.

### 7.2 `PawRecord` — new `src/lib/record.ts`
```ts
type RecordEntry =
  | { id: string; type: 'summary';     createdAt: string; concern: string; tier: string; text: string }
  | { id: string; type: 'weight';      createdAt: string; value: string; unit: string }
  | { id: string; type: 'vaccination'; createdAt: string; vaccine: string; dateGiven: string }
  | { id: string; type: 'medication';  createdAt: string; name: string; dose?: string; frequency?: string }
  | { id: string; type: 'qol';         createdAt: string; score: number }
  | { id: string; type: 'reminder';    createdAt: string; title: string; due: string; done: boolean }
  | { id: string; type: 'note';        createdAt: string; text: string }
```
localStorage key `pawai_record_v1`; `useRecord()` via `useSyncExternalStore` with a same-tab emitter (the session lib's noop-subscribe pattern is not enough here — forms must re-render the timeline on save). Writes wrap `setItem` in try/catch: on `QuotaExceededError` show an honest error ("This device's storage is full — the entry couldn't be saved") instead of silently dropping the entry (R4).

### 7.3 Honesty and privacy rules
- **No fake persistence claims** — the §5.3 persistence banner is mandatory; success toasts say "Saved to this device."
- **Email export** ("Email me {Pet}'s record/summary") reuses `/api/intake` → n8n → Gmail. `/api/intake` must return a real error when n8n fails (no fake success), and SaveRecordCard shows honest messages (invalid email / service unavailable / try again). **Blocked by the Gmail credential until Hadi reconnects it.**
- Health data stays on the visitor's device; email leaves only on explicit request. Consent checkbox at onboarding records `consentAt`.
- No public record URLs, no tokens, no server storage this phase.
- **Clear this device** (absorbed from the earlier draft): a small action on the dashboard ("Remove {Pet}'s record from this device") that wipes `pawai_session` + `pawai_record_v1` after a confirm. Owners on shared devices need an exit.
- **Legacy email links** (absorbed from the earlier draft): n8n confirmation emails previously linked to `/dashboard?oid=…`. After query-param identity is deleted, those links land on the session gate and redirect to `/welcome` — acceptable, but the n8n email template edit (drop the params) goes on Hadi's config list.

## 8. Get Started vs Login (decision)

- **Get Started** = new user → onboarding → dashboard. Session-aware header swaps it to **My Dashboard** for returning same-device users.
- **Login: hidden entirely for MVP.** Recommendation with reasoning: magic-link login has nothing to log into — the record lives in the visitor's localStorage, so a server-issued link cannot restore it on another device. A "coming soon" login page is a dead end that advertises a missing feature. When the tokenized record/DB phase ships, **email magic-link becomes the access path** (already the §3 plan in `PHASE1_MVP_PLAN.md`). Until then: no Login button, no `/login` route, no fake auth. Cross-device story today = the emailed summary ("keep this email").
- Phone is never required anywhere.

## 9. Safe copy (canonical strings)

- Consent checkbox: *"Save {Pet}'s record on this device and use my email only to send summaries I request. No account is created yet — you can clear this anytime."*
- Persistence banner: *"{Pet}'s record is stored on this device only. Email yourself a copy anytime — accounts that sync across devices are coming."*
- Care disclaimer (existing, keep everywhere summaries appear): *"PAWai organizes information. PAWai does not diagnose. Final medical decisions are always made by licensed veterinarians."*
- Guide upgrade line: §3.
- Reminders label: *"PAWai doesn't send notifications yet — this is your checklist."*
- Email failure states: "That email address doesn't look right." / "Our email service is having trouble — your summary is still saved on this device. Please try again in a bit."

## 10. Carry-over launch blockers (fold into this build, still required)

From this session's triple-review audit — the pivot does not erase them:
1. Stock human headset photo → PawLogo brand avatar; remove LIVE badge, fake timer, fake mic (`AICareJourney.tsx`, `PawAvatar.tsx`).
2. `useSpeech.ts` double-fire fix (duplicate first question root cause).
3. Showreel Pause/Replay/1x hidden in driven mode.
4. Honest intake errors (`/api/intake` 502 on webhook failure; SaveRecordCard messages).
5. Hardcoded n8n webhook fallbacks removed — env-only, clear failure (`/api/intake`, `/api/contact`); `/api/health/*` deleted outright (§5.3).
6. Delete `/careers` + `/press`; sitemap cleanup; footer "PAWai, Inc." → "PAWai".
7. `scroll-padding-top` for sticky-nav heading clipping.
8. Widget overlap at 375 px — solved structurally (no floating widget on /dashboard; Care Agent is an in-page module).

## 11. Implementation plan (after approval)

| Phase | Work | Files | CC effort |
|---|---|---|---|
| W0 | Carry-over fixes (§10) | `useSpeech.ts`, `PawAvatar.tsx`, `AICareJourney.tsx`, `SaveRecordCard.tsx`, `api/intake`, `api/contact`, `careers/`, `press/`, `sitemap.ts`, `Footer.tsx`, `globals.css` | ~1.5 h |
| W1 | Data layer: session v2 + record store + migration | `lib/session.ts`, new `lib/record.ts` | ~1 h |
| W2 | Onboarding 2-step | `WelcomeForm.tsx` (rewrite), `welcome/page.tsx` | ~1.5 h |
| W3 | Dashboard rebuild: gate, modules, local writes + read-back, reminders, persistence banner; delete query-param identity + `/api/health/*` | `dashboard/page.tsx` (server shell + client), `dashboard/components/*` | ~3 h |
| W4 | Health check inside dashboard; summary auto-save; SaveRecordCard rewire | `AICareJourney.tsx`, `SaveRecordCard.tsx`, dashboard | ~2 h |
| W5 | AI surfaces: SupportWidget context mode, hide-on-dashboard; header session CTA; homepage/demo copy | `SupportWidget.tsx`, `Header.tsx` (+ small client CTA), `page.tsx`, `demo/page.tsx` | ~1.5 h |
| W6 | QA pipeline: /gstack-review → /gstack-qa (375 px + desktop, production build) → /gstack-ship checks | — | ~1.5 h |

Total ≈ 1.5 days of CC work. No commits/pushes/deploys without explicit go-ahead.

**Hadi dependencies (not code):** ① ElevenLabs agent prompt update + dynamic-variables (§6; console or a later approved session via MCP), ② Gmail credential reconnect in n8n (blocks all email delivery), ③ `N8N_WEBHOOK_URL`/`BOOKING_WEBHOOK_URL` set in the deploy environment once fallbacks are removed.

## 12. Acceptance criteria (pass/fail)

1. Home "Create your pet's free profile" → `/welcome`; completing both steps lands on `/dashboard` with the profile card populated.
2. `/dashboard` with no session redirects to `/welcome`; `?oid=`-style params have no effect and appear nowhere.
3. Legacy pet-only session → `/welcome` prefilled, not a crash.
4. Guided health check runs inside the dashboard; summary appears in the Vet-Ready Summary module AND the timeline without a reload.
5. Weight/vaccination/medication/QoL/reminder entries render in the timeline immediately after save and survive a page reload.
6. No LIVE badge, call timer, mic control, stock human photo, or Pause/Replay/speed controls anywhere in the driven flow.
7. First AI question appears exactly once (verified in a production build, not only dev).
8. Public pages: widget receives zero user data (DOM-verified). `/dashboard`: no floating widget; Care Agent module carries the profile variables.
9. No Login link/route exists; header shows Get Started (no session) / My Dashboard (session).
10. Persistence banner visible on `/dashboard`; no copy anywhere claims cloud/account storage.
11. `/api/intake` returns non-2xx on n8n failure; SaveRecordCard shows the §9 messages; success only claims email delivery on genuine webhook success.
12. `grep -r "n8n-production" src/` → 0 hits; missing env → clear 503, logged.
13. `/careers`, `/press` return 404 and are absent from `sitemap.xml`; footer reads "© 2026 PAWai".
14. At 375 px: onboarding, dashboard modules, health check, and save card are fully usable, nothing covered.
15. `npx tsc --noEmit` clean; `next build` clean; console free of errors on all QA paths.

## 13. Testing plan

| Layer | What | How |
|---|---|---|
| Build | typecheck + production build | `tsc --noEmit`, `next build` |
| Flow QA | Home → onboarding → dashboard → check → summary → email attempt (fails honestly while Gmail down) | preview browser, desktop + 375 px |
| Persistence | reload after each entry type; clear localStorage → redirect | preview eval |
| AI boundary | inspect widget element attributes on `/` vs `/dashboard` | preview inspect |
| Regression | `/demo` showreel (no session), blog/research untouched | spot check |

## 14. Risks and rollback

| Risk | Mitigation |
|---|---|
| Onboarding friction drops starts vs 2-field form | 6 required fields, buckets not free text; if early users stall, drop email to step-3-on-save (one-line change; flagged as the conversion lever) |
| ElevenLabs config not ready at launch → Care Agent doesn't know the pet | Launch gate §6.2 (R1): module hidden behind env flag until a real call verifies context works |
| Care Agent (voice widget) overpromises | mode prompt + no auto-record-writes claim; guided check remains the summary path |
| Record loss on browser data clear | persistence banner + email export; acceptable stated MVP limit |
| Gmail stays down at launch | email UI shows honest failure; product still delivers summary on-screen + on-device; deploy stays blocked on this regardless |
| Scripted check breadth (4 branches) | labeled "guided"; Phase-2 real chat unchanged in roadmap |

Rollback: all work is uncommitted-branch scale; revert = `git checkout` of touched files. No data migrations, no server state.

## 15. Explicitly NOT in this build

Auth/passwords/magic-link, database or tokenized `/record/<token>`, clinic portal, Research Center/Knowledge Engine surfaces, push/email reminders, multi-pet, weight charts, free-text medical AI chat, new marketing claims, n8n workflow changes (except the ElevenLabs/Gmail config items owned by Hadi).

## 16. Plan-review findings (applied 2026-07-08)

Adversarial plan review (/gstack-review, plan-stage — no code diff existed) found and the spec now incorporates:

- **R1 (P0)** Care Agent behind `NEXT_PUBLIC_CARE_AGENT=1` launch gate — an agent that claims context it doesn't have is fake personalization (§6.2).
- **R2 (P1)** Data minimization + disclosure: only pet fields to ElevenLabs, never owner identity; disclosure line in-module and on the trust page. Neither currently mentions ElevenLabs — verified (§6.2).
- **R3 (P1)** Health Check vs Care Agent differentiating descriptors so the structured flow and the open conversation are never conflated (§5.3).
- **R4 (P2)** localStorage quota errors surface honestly (§7.2).
- **R5 (P2)** QoL module re-enters MVP scope — this reverses the earlier "QoL cut from MVP" audit decision, per Hadi's explicit dashboard direction. Reuses the existing `QoLSection.tsx`, so cost is small.
- **Scope-creep check:** Reminders, profile "Add details," and the Care Agent are all explicitly user-directed; W0 items were pre-approved launch blockers. No unauthorized scope found.
- **Fake-login check:** PASS (no login surface anywhere). **Dashboard exposure check:** PASS (no server-side user data; client gate; noindex; query-param identity deleted).

Verdict: **safe to implement after approval**, with R1's gate treated as blocking for the Care Agent module specifically.
