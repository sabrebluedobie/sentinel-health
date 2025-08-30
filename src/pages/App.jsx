// src/pages/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx"; // simple placeholder is fine
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import supabase from "@/lib/supabase";

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user || null);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) return <div style={{ padding: 16 }}>Loading…</div>;

  const Private = (el) => (user ? el : <Navigate to="/sign-in" replace />);

  return (
    <Routes>
      {/* Public (no Layout => no Settings button) */}
      <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/sign-up" element={user ? <Navigate to="/" replace /> : <SignUp />} />

      {/* Private (wrapped in Layout) */}
      <Route path="/" element={<Layout>{Private(<Dashboard />)}</Layout>} />
      <Route path="/log-migraine" element={<Layout>{Private(<LogMigraine />)}</Layout>} />
      <Route path="/log-sleep" element={<Layout>{Private(<LogSleep />)}</Layout>} />
      <Route path="/log-glucose" element={<Layout>{Private(<LogGlucose />)}</Layout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
    </Routes>
  );
}
