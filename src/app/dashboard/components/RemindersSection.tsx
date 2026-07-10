'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import { addRecordEntry, deleteRecordEntry, setReminderDone, useRecord } from '@/lib/record';

// An honest checklist: reminders live on this device and PAWai does NOT send
// notifications yet. The copy says exactly that — no fake capability.
export default function RemindersSection() {
  const record = useRecord();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ title: '', due: today() });

  const reminders = (record ?? [])
    .filter((e) => e.type === 'reminder')
    .sort((a, b) => (a.due < b.due ? -1 : 1));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    const result = addRecordEntry({ type: 'reminder', title, due: form.due, done: false });
    if (result.ok) {
      setOpen(false);
      setStatus('idle');
      setForm({ title: '', due: today() });
    } else {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  return (
    <Section icon="⏰" title="Reminders">
      <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: 12 }}>
        PAWai doesn&apos;t send notifications yet — this is your checklist, kept on this device.
      </p>
      {reminders.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {reminders.map((r) => (
            <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={r.done}
                onChange={(e) => setReminderDone(r.id, e.target.checked)}
                aria-label={`Mark "${r.title}" ${r.done ? 'not done' : 'done'}`}
                style={{ width: 15, height: 15, accentColor: 'var(--teal)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ color: r.done ? 'var(--tx3)' : 'var(--tx2)', textDecoration: r.done ? 'line-through' : 'none', flex: 1 }}>
                {r.title}
              </span>
              <span style={{ color: 'var(--tx3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{r.due}</span>
              <button
                type="button"
                onClick={() => deleteRecordEntry(r.id)}
                aria-label={`Delete reminder "${r.title}"`}
                style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px' }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {reminders.length === 0 && (
            <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>
              Add a reminder — a vaccine due date, a re-check, a medication refill.
            </p>
          )}
          <button onClick={() => setOpen(true)} className="btn btn--ghost btn--sm">+ Add Reminder</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="What" required>
            <input
              type="text" required placeholder="e.g. Rabies booster due"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Date">
            <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
          </Field>
          <FormActions onCancel={() => setOpen(false)} error={status === 'error' ? errorMsg : null} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
