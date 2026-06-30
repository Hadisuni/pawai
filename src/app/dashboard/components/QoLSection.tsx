'use client';

import { useState } from 'react';
import { Section } from './Section';
import { Field, FormActions } from './WeightSection';
import type { OwnerCtx } from './types';

const SCORES = ['1', '2', '3', '4', '5'] as const;

const DIMENSIONS = [
  { key: 'mobility',  label: 'Mobility',  hint: '1 = Can\'t move • 5 = Moves freely' },
  { key: 'appetite',  label: 'Appetite',  hint: '1 = Won\'t eat • 5 = Eats normally' },
  { key: 'mood',      label: 'Mood',      hint: '1 = Withdrawn • 5 = Playful & happy' },
  { key: 'painLevel', label: 'Pain',      hint: '1 = Severe pain • 5 = No pain signs' },
  { key: 'energy',    label: 'Energy',    hint: '1 = Very low • 5 = Full of energy' },
] as const;

type DimKey = typeof DIMENSIONS[number]['key'];

export default function QoLSection({ ctx }: { ctx: OwnerCtx }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [scores, setScores] = useState<Record<DimKey, string>>({
    mobility: '', appetite: '', mood: '', painLevel: '', energy: '',
  });
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());

  const overallScore = (() => {
    const vals = Object.values(scores).map(Number).filter(Boolean);
    return vals.length === 5 ? (vals.reduce((a, b) => a + b, 0) / 5).toFixed(1) : null;
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/health/qol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctx, date, ...scores, overallScore, notes }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) {
        setOpen(false);
        setScores({ mobility: '', appetite: '', mood: '', painLevel: '', energy: '' });
        setNotes('');
      }
    } catch { setStatus('error'); }
  }

  return (
    <Section icon="❤️" title="Quality of Life Assessment">
      {status === 'saved' && (
        <p style={{ color: 'var(--teal)', fontSize: '0.9rem', marginBottom: 12 }}>✓ Assessment saved!</p>
      )}
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>No assessment yet.</p>
            <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: 4 }}>
              Rate {ctx.petName || 'your pet'}&apos;s wellbeing across 5 dimensions in under 2 minutes.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn btn--accent btn--sm">
            Start Assessment
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Date">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>

          {DIMENSIONS.map(({ key, label, hint }) => (
            <div key={key}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: 8 }}>{hint}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {SCORES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScores(prev => ({ ...prev, [key]: s }))}
                    style={{
                      width: 40, height: 40,
                      borderRadius: 'var(--r-sm)',
                      border: `1px solid ${scores[key] === s ? 'var(--teal)' : 'var(--border)'}`,
                      background: scores[key] === s ? 'var(--teal3)' : 'transparent',
                      color: scores[key] === s ? 'var(--teal)' : 'var(--tx2)',
                      fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {overallScore && (
            <div style={{
              background: 'var(--teal3)',
              borderRadius: 'var(--r-sm)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: 'var(--tx2)', fontSize: '0.9rem', fontWeight: 600 }}>Overall Score</span>
              <span style={{ color: 'var(--teal)', fontSize: '1.4rem', fontWeight: 800 }}>{overallScore} / 5</span>
            </div>
          )}

          <Field label="Notes (optional)">
            <textarea
              rows={2}
              placeholder={`Any observations about ${ctx.petName || 'your pet'} today…`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </Field>

          <FormActions onCancel={() => setOpen(false)} saving={status === 'saving'} error={status === 'error'} />
        </form>
      )}
    </Section>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
