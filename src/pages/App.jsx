import React from "react";
import { Outlet } from "react-router-dom";
import ErrorBoundary from "../components/debug/ErrorBoundary.jsx";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ...your header/nav... */}
      <main style={{ flex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
