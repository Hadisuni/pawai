'use client';

import { useState } from 'react';

// The Care Card's only interactive bits: print (the browser's own dialog
// doubles as Save-as-PDF) and copying the private link. Wrapped in
// .care-card-actions so the print stylesheet can hide them on paper.
// The async clipboard API needs a secure context + user activation; the
// hidden-textarea path covers everything else (older Safari, embedded views).
function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export default function CareCardActions() {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copyLink() {
    const url = window.location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = legacyCopy(url);
    }
    setCopied(ok ? 'copied' : 'failed');
    setTimeout(() => setCopied('idle'), 2500);
  }

  return (
    <div className="care-card-actions" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--pri btn--sm" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={copyLink}>
          {copied === 'copied'
            ? '✓ Link copied'
            : copied === 'failed'
              ? 'Copy failed — use the address bar'
              : '🔗 Copy private link'}
        </button>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', lineHeight: 1.6, marginTop: 10 }}>
        This page is private to your PAWai sign-in. To give someone a copy,
        use Print / Save as PDF.
      </p>
    </div>
  );
}
