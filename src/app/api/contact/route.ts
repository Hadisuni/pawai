import { NextResponse } from 'next/server';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Production fallback so the route works even if BOOKING_WEBHOOK_URL isn't set in the deploy
// environment. Locally, .env.local points BOOKING_WEBHOOK_URL at the n8n test webhook instead.
const PRODUCTION_BOOKING_WEBHOOK_URL =
  'https://n8n-production-ee0c.up.railway.app/webhook/pawai-contact';

export async function POST(req: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, phone, message } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 });
  }

  const payload: ContactPayload = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    message: message.trim(),
  };

  const webhookUrl = process.env.BOOKING_WEBHOOK_URL || PRODUCTION_BOOKING_WEBHOOK_URL;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[api/contact] n8n webhook responded with', res.status);
      return NextResponse.json({ error: 'Failed to submit message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/contact] n8n webhook call failed:', err);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 502 });
  }
}
