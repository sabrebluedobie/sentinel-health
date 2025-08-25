import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error };
  }
  componentDidCatch(error, info){
    if (typeof window !== 'undefined' && window.console) {
      console.error('[ErrorBoundary]', error, info);
    }
  }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error || '')}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
