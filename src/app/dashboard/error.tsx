'use client';

// Escape hatch for a corrupted device record: the normal "clear this device"
// action lives on the dashboard itself, so if bad localStorage crashes the
// page, this boundary is the only way back.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  function clearAndRetry() {
    try {
      window.localStorage.removeItem('pawai_record_v1');
      window.localStorage.removeItem('pawai_session');
    } catch {
      // storage unavailable — retry alone may still work
    }
    reset();
  }

  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 10 }}>Something went wrong loading the record.</h1>
        <p style={{ color: 'var(--tx2)', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: 20 }}>
          The data saved on this device couldn&apos;t be read. You can try again, or clear
          this device&apos;s record and start fresh.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--pri btn--sm" onClick={() => reset()}>Try again</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearAndRetry}>
            Clear this device &amp; start fresh
          </button>
        </div>
      </div>
    </main>
  );
}
