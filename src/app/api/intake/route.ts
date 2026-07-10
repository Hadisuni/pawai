import { NextResponse } from 'next/server';

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

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[api/intake] N8N_WEBHOOK_URL is not configured — refusing to send');
    return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 });
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

  const response: IntakeResponse = {
    sessionId: crypto.randomUUID(),
    ownerName: payload.ownerName,
    pet: { name: payload.petName, species: payload.species, breed: payload.breed, age: payload.age, sex: payload.sex, weight: payload.weight },
    selectedExperience: payload.selectedExperience,
  };

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
    mainConcern: concern?.trim() || experienceLabel,
    message: message?.trim() || `Selected care path on /welcome: ${experienceLabel}`,
    source: message?.trim() ? 'Vet-Ready Summary Save' : 'Welcome Intake Form',
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
      // Honest failure: the UI must never claim "emailed" when nothing sent.
      console.error('[api/intake] n8n webhook responded with', res.status);
      return NextResponse.json({ error: 'Email service is unavailable' }, { status: 502 });
    }

    return NextResponse.json<IntakeResponse>(response);
  } catch (err) {
    console.error('[api/intake] n8n webhook call failed:', err);
    return NextResponse.json({ error: 'Email service is unavailable' }, { status: 502 });
  }
}
