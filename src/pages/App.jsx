// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import Header from "@/components/Header";
import SignIn from "@/components/SignIn";
import Dashboard from "./Dashboard";
import Settings from "./Settings";

// Temporary placeholders so the buttons work even if form pages are still WIP.
// Replace these later with real pages or your existing files.
function ComingSoon({ title }) {
  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="card" style={{ padding: 16, borderRadius: 14, border: "1px solid var(--border,#eee)" }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p>Form page coming soon.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signin" element={<SignIn />} />

      {/* Authenticated app frame */}
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* TEMP routes so buttons work */}
        <Route
          path="/log-glucose"
          element={
            <ProtectedRoute>
              <ComingSoon title="Log Glucose" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-sleep"
          element={
            <ProtectedRoute>
              <ComingSoon title="Log Sleep" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-migraine"
          element={
            <ProtectedRoute>
              <ComingSoon title="Log Migraine" />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
