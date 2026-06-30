import { NextResponse } from 'next/server';

const N8N_BASE = 'https://n8n-production-ee0c.up.railway.app/webhook';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { medName, dose, frequency, startDate, endDate, notes, oid, cid, ownerName, petName } = body;

    if (!medName) {
      return NextResponse.json({ error: 'medName is required' }, { status: 400 });
    }

    const payload = {
      oid: oid || '', cid: cid || '',
      ownerName: ownerName || '', petName: petName || '',
      medName, dose: dose || '', frequency: frequency || '',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || '',
      notes: notes || '',
      recordedAt: new Date().toISOString(),
    };

    const res = await fetch(`${N8N_BASE}/health-medication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) console.error('[api/health/medication] n8n responded', res.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/health/medication]', err);
    return NextResponse.json({ ok: false, error: 'Failed to save' }, { status: 500 });
  }
}
