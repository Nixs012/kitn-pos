'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('KiTN POS System Error:', error);
  }, [error]);

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
        {/* KiTN Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}>
          <div style={{ width: 44, height: 44, background: '#1D9E75', borderRadius: '12px 0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>K</div>
          <div style={{ width: 44, height: 44, background: '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>i</div>
          <div style={{ width: 44, height: 44, background: '#7F77DD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>T</div>
          <div style={{ width: 44, height: 44, background: '#D85A30', borderRadius: '0 12px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>N</div>
        </div>
        
        <div style={{ fontSize: 64, marginBottom: '1.5rem' }}>⚠️</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A2E', marginBottom: 12, letterSpacing: '-0.025em' }}>
          System Interrupted
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: '2rem', lineHeight: 1.6, fontWeight: 500 }}>
          KiTN POS encountered an unexpected issue. Don&apos;t worry, your transaction data and active cart are secure.
        </p>
        
        {/* Show error in development only */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 16,
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: '150px'
          }}>
            <p style={{ fontSize: 12, color: '#991B1B', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
              {error.message}
            </p>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#1D9E75',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 28px',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(29, 158, 117, 0.2)'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: '#F9FAFB',
              color: '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              padding: '14px 28px',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Terminal Home
          </button>
        </div>
      </div>
    </div>
  );
}
