import { NextResponse } from 'next/server';

const N8N_BASE = 'https://n8n-production-ee0c.up.railway.app/webhook';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, mobility, appetite, mood, painLevel, energy, overallScore, notes, oid, cid, ownerName, petName } = body;

    const payload = {
      oid: oid || '', cid: cid || '',
      ownerName: ownerName || '', petName: petName || '',
      date: date || new Date().toISOString().slice(0, 10),
      mobility: mobility || '', appetite: appetite || '',
      mood: mood || '', painLevel: painLevel || '',
      energy: energy || '', overallScore: overallScore || '',
      notes: notes || '',
      recordedAt: new Date().toISOString(),
    };

    const res = await fetch(`${N8N_BASE}/health-qol`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) console.error('[api/health/qol] n8n responded', res.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/health/qol]', err);
    return NextResponse.json({ ok: false, error: 'Failed to save' }, { status: 500 });
  }
}
