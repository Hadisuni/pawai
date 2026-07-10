'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import { addRecordEntry, useRecord } from '@/lib/record';

export default function MedicationSection() {
  const record = useRecord();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    medName: '', dose: '', frequency: '', startDate: today(), endDate: '', notes: '',
  });

  const entries = (record ?? []).filter((e) => e.type === 'medication');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.medName.trim();
    if (!name) return;
    const result = addRecordEntry({
      type: 'medication',
      name,
      dose: form.dose.trim() || undefined,
      frequency: form.frequency.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      notes: form.notes.trim() || undefined,
    });
    if (result.ok) {
      setStatus('saved');
      setOpen(false);
      setForm({ medName: '', dose: '', frequency: '', startDate: today(), endDate: '', notes: '' });
    } else {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  return (
    <Section icon="💊" title="Medications">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Saved to this device.</p>
      )}
      {entries.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {entries.slice(0, 5).map((m) => (
            <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--tx2)', fontWeight: 700 }}>
                {m.name}
                {(m.dose || m.frequency) && (
                  <span style={{ color: 'var(--tx3)', fontWeight: 400 }}>
                    {' — '}{[m.dose, m.frequency].filter(Boolean).join(', ')}
                  </span>
                )}
              </span>
              <span style={{ color: 'var(--tx3)', fontSize: '0.82rem' }}>{m.startDate}</span>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {entries.length === 0 && <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No medication entries yet.</p>}
          <button onClick={() => { setOpen(true); setStatus('idle'); }} className="btn btn--ghost btn--sm">+ Add Medication</button>
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
          <FormActions onCancel={() => setOpen(false)} error={status === 'error' ? errorMsg : null} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
