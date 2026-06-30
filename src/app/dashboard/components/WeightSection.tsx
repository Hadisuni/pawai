'use client';

import { useState } from 'react';
import { Section } from './Section';
import type { OwnerCtx } from './types';

export default function WeightSection({ ctx }: { ctx: OwnerCtx }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [form, setForm] = useState({ weight: '', unit: 'kg', date: today(), notes: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/health/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctx, ...form }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) { setOpen(false); setForm({ weight: '', unit: 'kg', date: today(), notes: '' }); }
    } catch { setStatus('error'); }
  }

  return (
    <Section icon="⚖️" title="Weight">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Weight saved!</p>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No weight records yet.</p>
          <button onClick={() => setOpen(true)} className="btn btn--ghost btn--sm">+ Add Weight</button>
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
          <FormActions onCancel={() => setOpen(false)} saving={status === 'saving'} error={status === 'error'} />
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

export function FormActions({ onCancel, saving, error }: { onCancel: () => void; saving: boolean; error: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="submit" disabled={saving} className="btn btn--pri btn--sm">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={onCancel} className="btn btn--ghost btn--sm">Cancel</button>
      {error && <p style={{ color: 'var(--red-muted)', fontSize: '0.85rem' }}>Something went wrong. Try again.</p>}
    </div>
  );
}

export const inputWrap: React.CSSProperties = {
  display: 'contents',
};
