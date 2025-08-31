import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "@/components/AuthContext";
import Dashboard from "@/pages/Dashboard.jsx";
import Settings from "@/pages/Settings.jsx";
import Education from "@/components/Education.jsx";

function Protected({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <Settings />
          </Protected>
        }
      />
      <Route
        path="/education"
        element={
          <Protected>
            <Education />
          </Protected>
        }
      />
      {/* keep your existing auth/other routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
