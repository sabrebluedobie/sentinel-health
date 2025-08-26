import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, info: null, err: null };
  }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(err, info){ this.setState({ info }); console.error('[ErrorBoundary]', err, info); }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding:16,fontFamily:'system-ui'}}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err?.message || this.state.err)}</pre>
          <button onClick={()=>location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}