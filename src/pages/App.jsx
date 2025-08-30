// src/pages/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx"; // or reuse SignIn with initialMode
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import { useAuth } from "@/components/AuthContext";

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // After OAuth: send the user to wherever we stashed
  useEffect(() => {
    if (!loading && user) {
      try {
        const n = sessionStorage.getItem("oauth_next");
        if (n && n.startsWith("/")) {
          sessionStorage.removeItem("oauth_next");
          if (location.pathname === "/sign-in" || location.pathname === "/sign-up") {
            navigate(n, { replace: true });
          }
        }
      } catch {}
    }
  }, [loading, user, navigate, location.pathname]);

  const Private = (el) => (loading ? <div style={{ padding: 16 }}>Loading…</div> : (user ? el : <Navigate to="/sign-in" replace />));

  return (
    <Routes>
      {/* Public (no Layout so there’s no Settings icon) */}
      <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/sign-up" element={user ? <Navigate to="/" replace /> : <SignIn initialMode="signup" />} />
      {/* or: <Route path="/sign-up" element={user ? <Navigate to="/" replace /> : <SignUp />} /> */}

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
