import { NextResponse } from 'next/server';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Env-only by design: no hardcoded production fallback (see api/intake).
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
  // Same relay hardening as api/intake: shape + size caps.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) {
    return NextResponse.json({ error: 'email is not a valid email address' }, { status: 400 });
  }
  if (name.length > 100 || (phone?.length ?? 0) > 40 || message.length > 6000) {
    return NextResponse.json({ error: 'field too long' }, { status: 400 });
  }

  const payload: ContactPayload = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    message: message.trim(),
  };

  const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[api/contact] BOOKING_WEBHOOK_URL is not configured — refusing to send');
    return NextResponse.json({ error: 'Contact service is not configured' }, { status: 503 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionType: 'contact', ...payload }),
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
