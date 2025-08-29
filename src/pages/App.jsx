// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Components / context
import Header from "../components/Header.jsx";
import { useAuth } from "../components/AuthContext.jsx";

// Pages (these live in /src/pages)
import Dashboard from "./Dashboard.jsx";
import LogGlucose from "./LogGlucose.jsx";
import LogSleep from "./LogSleep.jsx";
import LogMigraine from "./LogMigraine.jsx";
import Settings from "./Settings.jsx";

// Sign-in lives in /src/components per your repo
import SignIn from "../components/SignIn.jsx";

// Guard: only allow authenticated users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/signin" element={<SignIn />} />

        {/* Private */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-glucose"
          element={
            <ProtectedRoute>
              <LogGlucose />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-sleep"
          element={
            <ProtectedRoute>
              <LogSleep />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-migraine"
          element={
            <ProtectedRoute>
              <LogMigraine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        // inside <Routes> … </Routes>
<Route path="/log-glucose" element={<ProtectedRoute><LogGlucose /></ProtectedRoute>} />
<Route path="/log-sleep" element={<ProtectedRoute><LogSleep /></ProtectedRoute>} />
<Route path="/log-migraine" element={<ProtectedRoute><LogMigraine /></ProtectedRoute>} />


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
