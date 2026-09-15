import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled frontend render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage = this.state.error instanceof Error
      ? this.state.error.message
      : 'An unexpected frontend error occurred.';

    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '32px 24px',
          backgroundColor: 'var(--bg-primary, #ffffff)',
          color: 'var(--text-primary, #111111)',
          fontFamily: 'var(--font-main, sans-serif)',
        }}
      >
        <section style={{ maxWidth: '560px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary, #4a4a4a)' }}>
            SkillSwap could not render this page. Retry the page, or reload the application if the problem continues.
          </p>
          {import.meta.env.DEV && (
            <pre style={{ marginBottom: '24px', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {errorMessage}
            </pre>
          )}
          <button type="button" onClick={this.handleRetry} className="btn btn-primary">
            Retry
          </button>{' '}
          <button type="button" onClick={() => window.location.reload()} className="btn btn-outline">
            Reload
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
