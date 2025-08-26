import React from 'react';

export default class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('[ErrorBoundary]', error, info)}
  render(){
    if(this.state.error){
      return (
        <div style={{padding:16}}>
          <h1>Something went wrong.</h1>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
