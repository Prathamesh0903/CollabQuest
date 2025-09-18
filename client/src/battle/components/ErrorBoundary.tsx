import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Optionally log error to a service
    // console.error('Battle ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: 16, border: '1px solid rgba(229,229,229,0.15)', borderRadius: 8, background: '#2c2323', color: '#c65353' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Something went wrong.</div>
          <div style={{ opacity: 0.9 }}>{this.state.error?.message || 'Unknown error'}</div>
        </div>
      );
    }
    return this.props.children;
  }
}


