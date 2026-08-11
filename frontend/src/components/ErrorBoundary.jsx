import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#212121',
          color: '#ececec',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
          gap: '1rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>⚠️ Something went wrong</h1>
          <p style={{ color: '#b4b4b4', maxWidth: '480px' }}>
            The app encountered a runtime error. Check the browser console (F12) for details.
          </p>
          <pre style={{
            background: '#2f2f2f',
            border: '1px solid #424242',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.75rem',
            color: '#f87171',
            maxWidth: '600px',
            overflowX: 'auto',
            textAlign: 'left',
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#10a37f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
