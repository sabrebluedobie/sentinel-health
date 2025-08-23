import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = {error:null}; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ window.__bootlog?.("React error", error?.stack || String(error), info?.componentStack); }
  render(){
    if (this.state.error){
      return (
        <pre style={{
          whiteSpace:"pre-wrap", fontFamily:"ui-monospace,Menlo,monospace",
          background:"#111827", color:"#ffe4e6", border:"1px solid #4b5563",
          padding:12, borderRadius:10, maxWidth:900, margin:"16px auto"
        }}>
{`The app crashed in a component:\n\n${this.state.error?.stack || String(this.state.error)}\n\nFix that line and redeploy.`}
        </pre>
      );
    }
    return this.props.children;
  }
}