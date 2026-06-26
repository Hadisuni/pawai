import { NextResponse } from 'next/server';

export interface IntakePayload {
  ownerName: string;
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

// Frontend contract is intentionally stable: { sessionId, ownerName, pet, selectedExperience }.
// Today this is satisfied either by a real n8n webhook or a mock fallback —
// swapping n8n for Supabase/Postgres later means changing only this file.
// IMPORTANT: N8N_WEBHOOK_URL is read server-side only and never sent to the client.
export async function POST(req: Request) {
  let body: Partial<IntakePayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ownerName, petName, species, breed, age, sex, weight, selectedExperience } = body;
  if (!ownerName?.trim() || !petName?.trim() || !species?.trim() || !selectedExperience?.trim()) {
    return NextResponse.json(
      { error: 'ownerName, petName, species, and selectedExperience are required' },
      { status: 400 },
    );
  }

  const payload: IntakePayload = {
    ownerName: ownerName.trim(),
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

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    // No webhook configured — return a mock success so the UI keeps working.
    return NextResponse.json<IntakeResponse>(mockResponse);
  }

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
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[api/intake] n8n webhook responded with', res.status);
      return NextResponse.json<IntakeResponse>(mockResponse);
    }

    const data = await res.json().catch(() => null);
    return NextResponse.json<IntakeResponse>({
      sessionId: data?.sessionId || data?.session_id || mockResponse.sessionId,
      ownerName: payload.ownerName,
      pet: { name: payload.petName, species: payload.species, breed: payload.breed, age: payload.age, sex: payload.sex, weight: payload.weight },
      selectedExperience: payload.selectedExperience,
    });
  } catch (err) {
    // Network failure, timeout, DNS error, etc. — never block the visitor's flow on backend wiring.
    console.error('[api/intake] n8n webhook call failed, falling back to mock response:', err);
    return NextResponse.json<IntakeResponse>(mockResponse);
  }
}
