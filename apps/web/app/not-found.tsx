'use client';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F2F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '32px',
        padding: '3rem',
        maxWidth: '480px',
        width: '90%',
        textAlign: 'center',
        border: '0.5px solid #E8E8E8',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ fontSize: 72, marginBottom: '1.5rem' }}>🔍</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A2E', marginBottom: 12, letterSpacing: '-0.025em' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: '2rem', lineHeight: 1.6, fontWeight: 500 }}>
          We couldn&apos;t find the page you were looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: '#1D9E75',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '14px 32px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(29, 158, 117, 0.2)'
          }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
