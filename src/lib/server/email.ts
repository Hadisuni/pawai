// User-facing transactional email via Resend's REST API (plain fetch — no SDK
// dependency). Gated on RESEND_API_KEY: when unset, /api/intake falls back to
// the n8n → Gmail pipeline exactly as before.

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// onboarding@resend.dev works without domain verification but only delivers
// to the Resend account owner's address — real visitors need RESEND_FROM on
// a verified domain (see .env.example).
const FROM_FALLBACK = 'PAWai <onboarding@resend.dev>';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface SummaryEmailInput {
  to: string;
  ownerName?: string;
  petName: string;
  concern: string;
  summaryText: string;
  /** Private record link, included when persistent storage is configured. */
  recordUrl?: string;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendSummaryEmail(input: SummaryEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not configured' };

  const firstName = input.ownerName?.trim().split(' ')[0] || 'there';
  const recordBlockText = input.recordUrl
    ? `\n${input.petName}'s record — open it any time, from any device:\n${input.recordUrl}\n\nIt's private to you: opening it asks you to sign in to PAWai with this email address.\n`
    : '';

  const text = `Hi ${firstName},

Here is ${input.petName}'s vet-ready summary (${input.concern}) — ready to bring to the clinic. Your veterinary team makes the medical decisions; this summary helps them help you faster.

----------------------------------------
${input.summaryText}
----------------------------------------
${recordBlockText}
PAWai does not diagnose or treat. If your pet is in visible distress, contact a veterinary clinic right away.

— PAWai
`;

  const recordBlockHtml = input.recordUrl
    ? `<p style="margin:20px 0 4px"><a href="${escapeHtml(input.recordUrl)}" style="color:#0e7d78;font-weight:700">Open ${escapeHtml(input.petName)}&rsquo;s record</a> — it works any time, from any device.</p>
       <p style="margin:0;color:#6b7280;font-size:13px">It&rsquo;s private to you: opening it asks you to sign in to PAWai with this email address.</p>`
    : '';

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;line-height:1.65">
  <p>Hi ${escapeHtml(firstName)},</p>
  <p>Here is <strong>${escapeHtml(input.petName)}</strong>&rsquo;s vet-ready summary (${escapeHtml(input.concern)}) — ready to bring to the clinic. Your veterinary team makes the medical decisions; this summary helps them help you faster.</p>
  <pre style="white-space:pre-wrap;background:#f4f6f5;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-family:inherit;font-size:14px">${escapeHtml(input.summaryText)}</pre>
  ${recordBlockHtml}
  <p style="color:#6b7280;font-size:13px;margin-top:24px">PAWai does not diagnose or treat. If your pet is in visible distress, contact a veterinary clinic right away.</p>
  <p style="color:#6b7280;font-size:13px">— PAWai</p>
</div>`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || FROM_FALLBACK,
        to: [input.to],
        subject: `${input.petName}'s vet-ready summary — PAWai`,
        text,
        html,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Resend responded ${res.status}: ${detail.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Resend request failed' };
  }
}

export interface LoginLinkEmailInput {
  to: string;
  verifyUrl: string;
}

/** Passwordless sign-in — the emailed link carries a short-lived, single-use login token that exchanges for a session, see server/auth.ts. */
export async function sendLoginLinkEmail(input: LoginLinkEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not configured' };

  const text = `Sign in to PAWai

Use this link to sign in — it works once, within 15 minutes:
${input.verifyUrl}

Didn't request this? You can safely ignore this email.

— PAWai
`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;line-height:1.65">
  <p>Sign in to PAWai</p>
  <p><a href="${escapeHtml(input.verifyUrl)}" style="color:#0e7d78;font-weight:700">Click here to sign in</a> — this link works once, within 15 minutes.</p>
  <p style="color:#6b7280;font-size:13px;margin-top:24px">Didn&rsquo;t request this? You can safely ignore this email.</p>
  <p style="color:#6b7280;font-size:13px">— PAWai</p>
</div>`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || FROM_FALLBACK,
        to: [input.to],
        subject: 'Sign in to PAWai',
        text,
        html,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Resend responded ${res.status}: ${detail.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Resend request failed' };
  }
}
