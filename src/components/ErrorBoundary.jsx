import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null } }
  static getDerivedStateFromError(error){ return { error } }
  componentDidCatch(error, info){ console.error("[App Error]", error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="card w-full max-w-lg">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <pre className="mt-3 overflow-auto rounded bg-zinc-100 p-3 text-xs text-zinc-800">
              {this.state.error?.stack || ""}
            </pre>
            <button className="btn-primary mt-4" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}