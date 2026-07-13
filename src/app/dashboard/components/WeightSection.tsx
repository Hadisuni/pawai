'use client';

import { useState } from 'react';
import { Section } from './Section';
import { addRecordEntry, useRecord, type NewRecordEntry } from '@/lib/record';
import { syncEntryToCareCard, type CareCardSyncResult } from '@/lib/careCardSync';

// Writes to the device-local record and renders back what was saved —
// the record must always show your own entries (no write-only forms).
export default function WeightSection() {
  const record = useRecord();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [careCard, setCareCard] = useState<CareCardSyncResult | null>(null);
  const [form, setForm] = useState({ weight: '', unit: 'kg', date: today(), notes: '' });

  const entries = (record ?? []).filter((e) => e.type === 'weight');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const entry: NewRecordEntry = {
      type: 'weight',
      value: form.weight,
      unit: form.unit,
      date: form.date,
      notes: form.notes.trim() || undefined,
    };
    const result = addRecordEntry(entry);
    if (result.ok) {
      setStatus('saved');
      setOpen(false);
      setForm({ weight: '', unit: 'kg', date: today(), notes: '' });
      // Local-first: the device save above is done; the Care Card mirror is
      // best-effort and its failure never blocks anything.
      setCareCard(null);
      void syncEntryToCareCard(entry).then(setCareCard);
    } else {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  return (
    <Section icon="⚖️" title="Weight">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>
          ✓ Saved to this device.
          {careCard === 'synced' && ' Also saved to your Care Card.'}
          {careCard === 'failed' && (
            <span style={{ color: 'var(--tx3)' }}>
              {' '}Couldn&apos;t update your Care Card right now — this entry stays safely on this device.
            </span>
          )}
        </p>
      )}
      {entries.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {entries.slice(0, 5).map((w) => (
            <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--tx2)', fontWeight: 700 }}>
                {w.value} {w.unit}
                {w.notes && <span style={{ color: 'var(--tx3)', fontWeight: 400 }}> — {w.notes}</span>}
              </span>
              <span style={{ color: 'var(--tx3)', fontSize: '0.82rem' }}>{w.date}</span>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {entries.length === 0 && <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No weight entries yet.</p>}
          <button onClick={() => { setOpen(true); setStatus('idle'); }} className="btn btn--ghost btn--sm">+ Add Weight</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
            <Field label="Weight" required>
              <input
                type="number" step="0.1" min="0" required placeholder="e.g. 4.5"
                value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              />
            </Field>
            <Field label="Unit">
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </Field>
          </div>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <input type="text" placeholder="e.g. After vet visit" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>
          <FormActions onCancel={() => setOpen(false)} error={status === 'error' ? errorMsg : null} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && ' *'}
      </span>
      <div style={inputWrap}>{children}</div>
    </label>
  );
}

export function FormActions({ onCancel, error }: { onCancel: () => void; error: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="submit" className="btn btn--pri btn--sm">Save</button>
      <button type="button" onClick={onCancel} className="btn btn--ghost btn--sm">Cancel</button>
      {error && <p style={{ color: 'var(--red-muted)', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  );
}

export const inputWrap: React.CSSProperties = {
  display: 'contents',
};
