import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:16,fontFamily:"system-ui, -apple-system, Segoe UI, Roboto"}}>
          <h2 style={{margin:"8px 0"}}>Something went wrong.</h2>
          <pre style={{whiteSpace:"pre-wrap",background:"#111",color:"#eee",padding:12,borderRadius:8,overflow:"auto"}}>
{String(this.state.err?.stack || this.state.err || "Unknown error")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// also provide a named export so either import style works
export { ErrorBoundary };