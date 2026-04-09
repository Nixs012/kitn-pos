'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`KiTN POS [${this.props.section || 'Component'}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          background: '#FFF5F5',
          border: '1px solid #FED7D7',
          borderRadius: 24,
          padding: '2rem',
          textAlign: 'center',
          margin: '1rem 0'
        }}>
          <div style={{ fontSize: 32, marginBottom: '1rem' }}>🩹</div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#C53030', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {this.props.section || 'This Section'} Component Error
          </h3>
          <p style={{ fontSize: 13, color: '#9B2C2C', marginBottom: '1.5rem', fontWeight: 500 }}>
            {this.state.error?.message || 'Something went wrong while rendering this part of the terminal.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#1D9E75',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            Refresh Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
