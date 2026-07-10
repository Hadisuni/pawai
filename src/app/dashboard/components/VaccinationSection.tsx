'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import { addRecordEntry, useRecord } from '@/lib/record';

export default function VaccinationSection() {
  const record = useRecord();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    vaccineName: '', dateGiven: today(), nextDue: '', vetName: '', notes: '',
  });

  const entries = (record ?? []).filter((e) => e.type === 'vaccination');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const vaccine = form.vaccineName.trim();
    if (!vaccine) return;
    const result = addRecordEntry({
      type: 'vaccination',
      vaccine,
      dateGiven: form.dateGiven,
      nextDue: form.nextDue || undefined,
      vetName: form.vetName.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    if (result.ok) {
      setStatus('saved');
      setOpen(false);
      setForm({ vaccineName: '', dateGiven: today(), nextDue: '', vetName: '', notes: '' });
    } else {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  return (
    <Section icon="💉" title="Vaccinations">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Saved to this device.</p>
      )}
      {entries.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {entries.slice(0, 5).map((v) => (
            <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--tx2)', fontWeight: 700 }}>
                {v.vaccine}
                {v.nextDue && <span style={{ color: 'var(--tx3)', fontWeight: 400 }}> — next due {v.nextDue}</span>}
              </span>
              <span style={{ color: 'var(--tx3)', fontSize: '0.82rem' }}>{v.dateGiven}</span>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {entries.length === 0 && <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No vaccination entries yet.</p>}
          <button onClick={() => { setOpen(true); setStatus('idle'); }} className="btn btn--ghost btn--sm">+ Add Vaccine</button>
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
          <FormActions onCancel={() => setOpen(false)} error={status === 'error' ? errorMsg : null} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
