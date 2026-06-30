'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import type { OwnerCtx } from './types';

export default function VaccinationSection({ ctx }: { ctx: OwnerCtx }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [form, setForm] = useState({
    vaccineName: '', dateGiven: today(), nextDue: '', vetName: '', notes: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/health/vaccination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctx, ...form }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) { setOpen(false); setForm({ vaccineName: '', dateGiven: today(), nextDue: '', vetName: '', notes: '' }); }
    } catch { setStatus('error'); }
  }

  return (
    <Section icon="💉" title="Vaccinations">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Vaccination saved!</p>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No vaccination records yet.</p>
          <button onClick={() => setOpen(true)} className="btn btn--ghost btn--sm">+ Add Vaccine</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Vaccine Name" required>
            <input
              type="text" required placeholder="e.g. Rabies, DHPP, Bordetella"
              value={form.vaccineName} onChange={e => setForm(f => ({ ...f, vaccineName: e.target.value }))}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Date Given">
              <input type="date" value={form.dateGiven} onChange={e => setForm(f => ({ ...f, dateGiven: e.target.value }))} />
            </Field>
            <Field label="Next Due (optional)">
              <input type="date" value={form.nextDue} onChange={e => setForm(f => ({ ...f, nextDue: e.target.value }))} />
            </Field>
          </div>
          <Field label="Veterinarian (optional)">
            <input type="text" placeholder="e.g. Dr. Smith" value={form.vetName} onChange={e => setForm(f => ({ ...f, vetName: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <input type="text" placeholder="e.g. No adverse reactions" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
          <FormActions onCancel={() => setOpen(false)} saving={status === 'saving'} error={status === 'error'} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
