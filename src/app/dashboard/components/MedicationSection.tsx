'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import type { OwnerCtx } from './types';

export default function MedicationSection({ ctx }: { ctx: OwnerCtx }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [form, setForm] = useState({
    medName: '', dose: '', frequency: '', startDate: today(), endDate: '', notes: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/health/medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctx, ...form }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) { setOpen(false); setForm({ medName: '', dose: '', frequency: '', startDate: today(), endDate: '', notes: '' }); }
    } catch { setStatus('error'); }
  }

  return (
    <Section icon="💊" title="Medications">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Medication saved!</p>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No medication records yet.</p>
          <button onClick={() => setOpen(true)} className="btn btn--ghost btn--sm">+ Add Medication</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Medication Name" required>
            <input
              type="text" required placeholder="e.g. Apoquel, Prednisone"
              value={form.medName} onChange={e => setForm(f => ({ ...f, medName: e.target.value }))}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Dose (optional)">
              <input type="text" placeholder="e.g. 5mg" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
            </Field>
            <Field label="Frequency (optional)">
              <input type="text" placeholder="e.g. Once daily" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </Field>
            <Field label="End Date (optional)">
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <input type="text" placeholder="e.g. With food" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
          <FormActions onCancel={() => setOpen(false)} saving={status === 'saving'} error={status === 'error'} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
