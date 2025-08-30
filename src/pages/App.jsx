// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx"; // can be a thin wrapper; see note below
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import { useAuth } from "@/components/AuthContext";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  const Private = (el) => (user ? el : <Navigate to="/sign-in" replace />);

  return (
    <Routes>
      {/* Public (no Layout) */}
      <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />
      {/* If you want /sign-up to reuse SignIn with preselected mode: */}
      <Route path="/sign-up" element={user ? <Navigate to="/" replace /> : <SignIn initialMode="signup" />} />
      {/* or if you have a dedicated SignUp.jsx, keep: <SignUp /> */}

      {/* Private (wrapped in Layout) */}
      <Route path="/" element={<Layout>{Private(<Dashboard />)}</Layout>} />
      <Route path="/log-migraine" element={<Layout>{Private(<LogMigraine />)}</Layout>} />
      <Route path="/log-sleep"    element={<Layout>{Private(<LogSleep />)}</Layout>} />
      <Route path="/log-glucose"  element={<Layout>{Private(<LogGlucose />)}</Layout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
    </Routes>
  );
}
