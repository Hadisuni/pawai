export function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 20,
        background: 'var(--glass)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '22px 24px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--tx1)',
        }}
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EmptyState({ message, cta, href, onClick }: {
  message: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <p style={{ color: 'var(--tx3)', fontSize: '0.9rem' }}>{message}</p>
      {href ? (
        <a href={href} className="btn btn--ghost btn--sm">{cta}</a>
      ) : (
        <button onClick={onClick} className="btn btn--ghost btn--sm">{cta}</button>
      )}
    </div>
  );
}
