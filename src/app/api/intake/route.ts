import { NextResponse } from 'next/server';
import { appOrigin } from '@/lib/server/origin';
import { isDbConfigured } from '@/lib/server/db';
import { saveSummaryToRecord } from '@/lib/server/recordStore';
import { isEmailConfigured, sendSummaryEmail } from '@/lib/server/email';
import { createSessionForOwner, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/server/auth';
import { logError } from '@/lib/server/log';

// Attaches the paw_session cookie when this request minted one (first-time
// visitors are signed in transparently on save, so /dashboard doesn't wall
// them out the moment DB auth is turned on — see server/auth.ts). No-op
// when sessionToken is undefined (DB not configured, or the mint failed).
function withSession(res: NextResponse, sessionToken: string | undefined): NextResponse {
  if (sessionToken) {
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
  }
  return res;
}

export interface IntakePayload {
  ownerName: string;
  ownerEmail: string;
  petName: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
  selectedExperience: string;
  /** What the conversation was about (e.g. "Vomiting") — lands in the sheet's Main Concern column. */
  concern?: string;
  /** Free text echoed back in the confirmation email — used to deliver the vet-ready summary. */
  message?: string;
}

export interface IntakeResponse {
  sessionId: string;
  ownerName: string;
  pet: { name: string; species: string; breed?: string; age?: string; sex?: string; weight?: string };
  selectedExperience: string;
  /** Private link to the durable record — present only when storage is configured. */
  recordUrl?: string;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  health: 'Health Assessment',
  behavior: 'Behavior & Training',
  newpet: 'New Pet Guide',
  nutrition: 'Nutrition',
  wellness: 'Wellness',
};

// Env-only by design: no hardcoded production fallback. If N8N_WEBHOOK_URL is
// missing the route fails loudly (503) instead of silently posting user PII
// to a URL baked into source. The client shows an honest "service
// unavailable" message and the visitor's summary stays on their device.
export async function POST(req: Request) {
  let body: Partial<IntakePayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ownerName, ownerEmail, petName, species, breed, age, sex, weight, selectedExperience, concern, message } = body;
  if (!ownerName?.trim() || !ownerEmail?.trim() || !petName?.trim() || !species?.trim() || !selectedExperience?.trim()) {
    return NextResponse.json(
      { error: 'ownerName, ownerEmail, petName, species, and selectedExperience are required' },
      { status: 400 },
    );
  }

  // This route relays content into an email pipeline under PAWai's sender
  // identity — validate shape and cap sizes so it can't be used to deliver
  // arbitrary payloads to arbitrary addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()) || ownerEmail.trim().length > 254) {
    return NextResponse.json({ error: 'ownerEmail is not a valid email address' }, { status: 400 });
  }
  const LIMITS: Array<[string | undefined, number, string]> = [
    [ownerName, 100, 'ownerName'],
    [petName, 60, 'petName'],
    [species, 40, 'species'],
    [breed, 80, 'breed'],
    [age, 40, 'age'],
    [sex, 40, 'sex'],
    [weight, 40, 'weight'],
    [selectedExperience, 40, 'selectedExperience'],
    [concern, 120, 'concern'],
    [message, 6000, 'message'],
  ];
  for (const [value, max, field] of LIMITS) {
    if (typeof value === 'string' && value.length > max) {
      return NextResponse.json({ error: `${field} is too long (max ${max} characters)` }, { status: 400 });
    }
  }

  const experienceLabel = EXPERIENCE_LABELS[selectedExperience.trim()] ?? selectedExperience.trim();

  const payload: IntakePayload = {
    ownerName: ownerName.trim(),
    ownerEmail: ownerEmail.trim(),
    petName: petName.trim(),
    species: species.trim(),
    breed: breed?.trim(),
    age: age?.trim(),
    sex: sex?.trim(),
    weight: weight?.trim(),
    selectedExperience: selectedExperience.trim(),
  };

  const summaryText = message?.trim();
  const concernLabel = concern?.trim() || experienceLabel;

  // Phase 0 persistence: when DATABASE_URL is set, a saved summary also lands
  // in the durable record and the response carries its private link. A DB
  // failure must never block the email path — the summary is still on the
  // visitor's device and in their inbox.
  let recordUrl: string | undefined;
  let sessionToken: string | undefined;
  if (summaryText && isDbConfigured()) {
    try {
      const { recordToken, ownerId } = await saveSummaryToRecord({
        ownerEmail: payload.ownerEmail,
        ownerName: payload.ownerName,
        pet: {
          name: payload.petName,
          species: payload.species,
          breed: payload.breed,
          age: payload.age,
          sex: payload.sex,
          weight: payload.weight,
        },
        concern: concernLabel,
        summaryText,
      });
      recordUrl = `${appOrigin()}/record/${recordToken}`;
      // Auto-sign-in: this is the visitor's first save, so there's nothing
      // to "log into" yet from their point of view — a forced /signin step
      // here would just be friction. Returning on another device still goes
      // through the magic-link flow. A failure here must not block saving.
      try {
        const session = await createSessionForOwner(ownerId);
        sessionToken = session.rawToken;
      } catch (err) {
        logError('api/intake', 'auto session mint failed', err);
      }
    } catch (err) {
      console.error('[api/intake] record persistence failed:', err);
    }
  }

  const response: IntakeResponse = {
    sessionId: crypto.randomUUID(),
    ownerName: payload.ownerName,
    pet: { name: payload.petName, species: payload.species, breed: payload.breed, age: payload.age, sex: payload.sex, weight: payload.weight },
    selectedExperience: payload.selectedExperience,
    recordUrl,
  };

  // Phase 0 email: when RESEND_API_KEY is set, the app sends the user-facing
  // summary email itself instead of relying on the n8n → Gmail pipeline.
  // While both are live, disable the visitor-email node in the n8n workflow
  // to avoid a duplicate email (the sheet/admin branch should stay on).
  let userEmailSent = false;
  if (summaryText && isEmailConfigured()) {
    const sent = await sendSummaryEmail({
      to: payload.ownerEmail,
      ownerName: payload.ownerName,
      petName: payload.petName,
      concern: concernLabel,
      summaryText,
      recordUrl,
    });
    if (sent.ok) {
      userEmailSent = true;
    } else {
      // Fall through to the n8n path so delivery still has a chance.
      console.error('[api/intake] Resend send failed:', sent.error);
    }
  }

  // n8n forward: still the data pipeline (sheet row + admin notification),
  // and still the visitor email when Resend isn't configured. Its failure is
  // fatal only when nothing else delivered the user-facing email.
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    if (userEmailSent) {
      console.warn('[api/intake] N8N_WEBHOOK_URL not configured — skipping sheet/admin forward');
      return withSession(NextResponse.json<IntakeResponse>(response), sessionToken);
    }
    console.error('[api/intake] N8N_WEBHOOK_URL is not configured — refusing to send');
    return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 });
  }

  // Shaped to match PawAI Contact Form's Normalize Submission node field names
  // (ownerName/ownerEmail/petName/.../mainConcern/message), not the IntakePayload shape above.
  const webhookBody = {
    ownerName: payload.ownerName,
    ownerEmail: payload.ownerEmail,
    petName: payload.petName,
    species: payload.species,
    breed: payload.breed,
    age: payload.age,
    sex: payload.sex,
    weight: payload.weight,
    mainConcern: concernLabel,
    message: summaryText || `Selected care path on /welcome: ${experienceLabel}`,
    source: summaryText ? 'Vet-Ready Summary Save' : 'Welcome Intake Form',
  };

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.N8N_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.N8N_API_KEY}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[api/intake] n8n webhook responded with', res.status);
      if (userEmailSent) return withSession(NextResponse.json<IntakeResponse>(response), sessionToken);
      // Honest failure: the UI must never claim "emailed" when nothing sent.
      return NextResponse.json({ error: 'Email service is unavailable' }, { status: 502 });
    }

    return withSession(NextResponse.json<IntakeResponse>(response), sessionToken);
  } catch (err) {
    console.error('[api/intake] n8n webhook call failed:', err);
    if (userEmailSent) return withSession(NextResponse.json<IntakeResponse>(response), sessionToken);
    return NextResponse.json({ error: 'Email service is unavailable' }, { status: 502 });
  }
}
