import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💥</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Что-то пошло не так</h2>
          <p style={{ fontSize: '14px', opacity: 0.5, marginBottom: '24px', maxWidth: '300px' }}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 32px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Обновить страницу
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '24px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.2)',
              fontSize: '11px',
              opacity: 0.6,
              maxWidth: '100%',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
