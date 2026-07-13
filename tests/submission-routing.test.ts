import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Covers the n8n integration repair: both /api/intake and /api/contact must
// tag their outgoing webhook body with submissionType so the (now-fixed)
// PawAI Contact Form workflow can route intake vs. contact deliberately
// instead of merging them by field-shape coincidence. Also covers the other
// half of that repair: the route must surface n8n's real success/failure
// signal (2xx -> success, anything else -> 502) rather than assuming success
// once a request was sent.

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DATABASE_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
  delete process.env.N8N_API_KEY;
}

beforeEach(() => {
  resetEnv();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe('/api/intake submissionType + response gating', () => {
  it('tags the n8n webhook body with submissionType: "intake"', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../src/app/api/intake/route');
    const req = new Request('http://localhost/api/intake', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'QA Owner',
        ownerEmail: 'qa@example.com',
        petName: 'Rex',
        species: 'Dog',
        selectedExperience: 'health',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.submissionType).toBe('intake');
    expect(sentBody.ownerEmail).toBe('qa@example.com');
  });

  it('returns 502 (not a false 200) when n8n responds non-2xx', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 400 })));

    const { POST } = await import('../src/app/api/intake/route');
    const req = new Request('http://localhost/api/intake', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'QA Owner',
        ownerEmail: 'qa@example.com',
        petName: 'Rex',
        species: 'Dog',
        selectedExperience: 'health',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('returns 502 when the n8n webhook call throws (network failure)', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { POST } = await import('../src/app/api/intake/route');
    const req = new Request('http://localhost/api/intake', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'QA Owner',
        ownerEmail: 'qa@example.com',
        petName: 'Rex',
        species: 'Dog',
        selectedExperience: 'health',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it('still returns 400 for a malformed payload without ever calling the webhook', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../src/app/api/intake/route');
    const req = new Request('http://localhost/api/intake', {
      method: 'POST',
      body: JSON.stringify({ ownerName: '', ownerEmail: 'not-an-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/contact submissionType + response gating', () => {
  it('tags the n8n webhook body with submissionType: "contact"', async () => {
    process.env.BOOKING_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../src/app/api/contact/route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'QA Contact', email: 'qa-contact@example.com', message: 'hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.submissionType).toBe('contact');
    expect(sentBody.email).toBe('qa-contact@example.com');
  });

  it('returns 502 (not a false success) when n8n responds non-2xx', async () => {
    process.env.BOOKING_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 502 })));

    const { POST } = await import('../src/app/api/contact/route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'QA Contact', email: 'qa-contact@example.com', message: 'hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBeUndefined();
  });

  it('returns 502 when the n8n webhook call throws (network failure)', async () => {
    process.env.BOOKING_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { POST } = await import('../src/app/api/contact/route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'QA Contact', email: 'qa-contact@example.com', message: 'hello' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it('still returns 400 for a malformed payload without ever calling the webhook', async () => {
    process.env.BOOKING_WEBHOOK_URL = 'https://n8n.example/webhook/pawai-contact';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('../src/app/api/contact/route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
