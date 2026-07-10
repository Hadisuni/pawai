# PAWai Phase 1 — Product Fix Plan

**Status: Steps 1–3 shipped (this working tree). Step 4 partially shipped. The readable record is the remaining major change and starts only after the decisions in §6 are made.**

The new core loop:

```
Landing → Start Free → Pet name/species → Conversation → Vet-Ready Summary
        → Email capture ("Keep this summary") → [Private record link → Readable record]
                                                 ^^^ remaining major work ^^^
```

---

## 1. What changed (already implemented, uncommitted)

### Honest-claims pass
| File | Change |
|---|---|
| `src/app/page.tsx` | Removed: "240,000+ pet parents", fake clinic logos strip, "Vet in the loop" card, entire "For clinics & vets" section (fake stats: 68%, 1,200+ clinics, 4.9★), Evidence Library showcase, fabricated testimonial (Maya Hernandez), "Reviewed by a vet in under 10 min" card, "Dr. Okafor" chat line, HR/activity vitals implying device monitoring, `id="pricing"`. Rewrote: hero eyebrow/lead, how-it-works steps (no photo/voice/"millions of cases"/"nearest open clinic" claims), features (urgency tiers + record + honesty card — all true today). |
| `src/app/layout.tsx` | Site meta description no longer says "veterinarian-reviewed". |
| `src/components/Header.tsx` | Removed Pricing, For vets, and the fake "Log in" link (there are no accounts). |
| `src/components/Footer.tsx` | Removed Pricing, For vets, Careers, Press links and "Vet-reviewed care" tagline. Note: `/careers` and `/press` **pages still exist** — delinked only; delete the routes when convenient. |

### /experiences removed from the journey
- `src/app/experiences/page.tsx` → now a server `redirect('/welcome')` (old links keep working).
- `src/components/ExperiencePicker.tsx` → **deleted** (git rm).
- `src/app/sitemap.ts` → /experiences entry removed.

### /welcome simplified
- `src/components/WelcomeForm.tsx` → rewritten: **pet name + species only**, no email, no server call. Creates a localStorage session and routes straight to the conversation. Copy: "No account, no email needed."
- `src/app/welcome/page.tsx` → "Who are we helping today?"

### Email capture moved after the first value moment
- `src/components/AICareJourney.tsx` → **driven mode**: a visitor with a session (came via /welcome) answers every question themselves (no auto-play impersonating them) and the conversation **ends at the summary** instead of looping into the next demo scenario. Without a session, /demo remains the self-playing showreel.
- `src/components/care-journey/SaveRecordCard.tsx` → **new**: "Keep this summary" card shown beside the Vet-Ready Summary. Email (required) + name (optional) → POSTs to the existing `/api/intake` → n8n pipeline. The plain-text summary travels in the `message` field, so the confirmation email the visitor receives **contains their actual summary** (echoed in the email's "Your message" block) — no n8n changes required.
- `src/app/api/intake/route.ts` → accepts optional `concern` + `message` (Main Concern column now shows the real complaint, e.g. "Vomiting"; source: "Vet-Ready Summary Save").

### Components kept as-is
`SummaryCard`, `PriorityBadge`, `FindingsPanel`, `TimelinePanel`, `PawAvatar`, `CareJourneyModeSwitcher` (copy tweak only), `SupportWidget` (one site-wide ElevenLabs agent), dashboard section components (unchanged; see §6), `LiveVoiceJourney` (dormant, reversible), `lib/session` (draft helpers now unused — harmless, prune later).

---

## 2. Verified end-to-end (2026-07-08)

/welcome (2 fields) → /demo greets "Max" → picker **waits** for real input → user-driven branch → summary renders and **persists** (no 7-second loop) → SaveRecordCard → submit → n8n webhook received the full summary text, `mainConcern: Vomiting`, Sheet1 row written. `tsc` clean.

**⚠ Found during verification — launch-blocking, needs Hadi:** both Gmail sends in the n8n workflow now fail with `Client authentication failed` on the "Gmail account" credential (execution 259; also 258). The visitor's summary email and the admin notification **do not deliver**, while the UI says "has been emailed to you." This is the recurring Gmail credential problem, now hard-down. Fix: n8n → Credentials → "Gmail account" → Reconnect (and check the GCP OAuth client). Until fixed, the save flow writes to the sheet but delivers no email — the product's one honest-claims gap left, and it's infra, not copy.

---

## 3. The remaining major change: the Readable Record

**Definition of done:** a visitor who saved their summary can open a private link any time and see: their pet's profile, every conversation summary, and every weight/vaccination entry — newest first. Every save is visible immediately.

### Data needed
- **Pet**: id, name, species, breed?, age?, sex? — created at first save.
- **Owner**: email (identity), name? — created at email capture.
- **Record entries**: type (`summary` | `weight` | `vaccination` | `note`), payload (summary text / value+unit / vaccine+date), createdAt.
- **Access token**: unguessable per-record token → the "private link" (`/record/<token>`). Not query-param identity.

### Storage decision (blocker — Hadi picks one)
1. **Recommended: a real database** (Neon/Vercel Postgres — the site already deploys on Vercel). Read+write from Next.js API routes. Solves readback, per-user isolation, and the GDPR posture in one move. ~2–3 days of work.
2. **Stopgap: keep Google Sheets, add readback** via an n8n GET webhook per record. Works, but slow, racy, no isolation, and doubles down on PII-in-a-spreadsheet. Not recommended for launch.

### Consequential rewires once storage exists
- `/dashboard` → becomes `/record/<token>`; the four write-only forms post to the DB and **render what they saved**. QoL section removed from MVP (per audit); medication folded into notes.
- SaveRecordCard success → shows the private link immediately (not only email).
- n8n confirmation email → include the record link (one template edit, the only n8n change).
- ElevenLabs post-call webhook → optionally also writes the call summary into the record (the n8n branch already extracts it).

### Explicitly NOT in Phase 1
Auth/passwords, reminders, weight charts, multi-pet, voice mode, QoL, clinic features, localization. Content engine and 90-day calendar untouched.

## 4. Risks
1. **Gmail credential down** (§2) — the whole email loop depends on it. Alternative worth considering at DB time: send transactional email from the app (e.g. Resend) instead of n8n+Gmail, which also removes the "confirmation claims sent but n8n failed silently" hazard (`/api/intake` returns success even when n8n fails, by design).
2. **The conversation is scripted** (4 branches, fixed options). Honest framing ("guided questions") ships fine, but breadth is thin: anything outside vomiting/limping/ear-skin/breathing funnels badly. Phase 2: real profile-aware AI chat.
3. **PII currently in Sheets** (owner emails + summaries) — GDPR exposure until the DB move; delete test rows and old intake rows after migration.
4. **Browser TTS pacing** — the conversation reads each line aloud; on some devices this feels slow. Consider default-muted for driven mode (one-line change) if early users complain.
5. **Reduced-motion users** get the pre-baked showreel even in driven mode (pre-existing edge case) — fix when touching AICareJourney next.

## 5. Sequence for the record build (after storage decision)
1. Provision DB + schema (pets, owners, entries, tokens).
2. `/api/record` write path; point SaveRecordCard + weight/vaccination forms at it (keep n8n POST for the email until #4).
3. `/record/<token>` readable page (list view, print stylesheet for summaries).
4. Email the link (n8n template edit or app-sent email).
5. Migrate/retire `/dashboard`; delete QoL + medication sections; kill test rows in Sheets.
