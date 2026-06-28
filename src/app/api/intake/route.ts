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

// Production fallback so the route works even if N8N_WEBHOOK_URL isn't set in the deploy
// environment — mirrors src/app/api/contact/route.ts. This points at the same PawAI Contact
// Form workflow (production webhook), so /welcome submissions land in the same Sheet1 +
// Gmail confirmation pipeline as the /contact form.
const PRODUCTION_PAWAI_WEBHOOK_URL =
  'https://n8n-production-ee0c.up.railway.app/webhook/pawai-contact';

// Frontend contract is intentionally stable: { sessionId, ownerName, pet, selectedExperience }.
// IMPORTANT: N8N_WEBHOOK_URL is read server-side only and never sent to the client.
export async function POST(req: Request) {
  let body: Partial<IntakePayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ownerName, ownerEmail, petName, species, breed, age, sex, weight, selectedExperience } = body;
  if (!ownerName?.trim() || !ownerEmail?.trim() || !petName?.trim() || !species?.trim() || !selectedExperience?.trim()) {
    return NextResponse.json(
      { error: 'ownerName, ownerEmail, petName, species, and selectedExperience are required' },
      { status: 400 },
    );
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

  const mockResponse: IntakeResponse = {
    sessionId: crypto.randomUUID(),
    ownerName: payload.ownerName,
    pet: { name: payload.petName, species: payload.species, breed: payload.breed, age: payload.age, sex: payload.sex, weight: payload.weight },
    selectedExperience: payload.selectedExperience,
  };

  const webhookUrl = process.env.N8N_WEBHOOK_URL || PRODUCTION_PAWAI_WEBHOOK_URL;

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
    mainConcern: experienceLabel,
    message: `Selected care path on /welcome: ${experienceLabel}`,
    source: 'Welcome Intake Form',
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
      return NextResponse.json<IntakeResponse>(mockResponse);
    }

    return NextResponse.json<IntakeResponse>(mockResponse);
  } catch (err) {
    // Network failure, timeout, DNS error, etc. — never block the visitor's flow on backend wiring.
    console.error('[api/intake] n8n webhook call failed, falling back to mock response:', err);
    return NextResponse.json<IntakeResponse>(mockResponse);
  }
}
