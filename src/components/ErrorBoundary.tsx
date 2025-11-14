import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome, faRotateRight } from '@fortawesome/free-solid-svg-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you could send this to an error tracking service
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '#/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          padding: '2rem'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            {/* Error Icon */}
            <div style={{
              fontSize: '5rem',
              marginBottom: '1.5rem',
              color: '#ef4444'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>

            {/* Error Title */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--color-text)',
              marginBottom: '1rem'
            }}>
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p style={{
              color: 'var(--color-secondary)',
              marginBottom: '2rem',
              fontSize: '1.1rem'
            }}>
              We're sorry, but something unexpected happened. 
              Don't worry - your data is safe.
            </p>

            {/* Error Details (only in development) */}
            {import.meta.env.MODE === 'development' && this.state.error && (
              <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'left',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--color-interactive)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--color-interactive-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--color-interactive)';
                }}
              >
                <FontAwesomeIcon icon={faHome} />
                Go Home
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: 'var(--color-interactive)',
                  border: '2px solid var(--color-interactive)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--color-interactive)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-interactive)';
                }}
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p style={{
              marginTop: '2rem',
              color: 'var(--color-secondary)',
              fontSize: '0.875rem'
            }}>
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

