// src/pages/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import SignUp from "@/pages/SignUp.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import supabase from "@/lib/supabase"; // default export to match the rest of the repo

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
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/sign-up" element={user ? <Navigate to="/" replace /> : <SignUp />} />

        {/* Private routes */}
        <Route path="/" element={Private(<Dashboard />)} />
        <Route path="/log-migraine" element={Private(<LogMigraine />)} />
        <Route path="/log-sleep" element={Private(<LogSleep />)} />
        <Route path="/log-glucose" element={Private(<LogGlucose />)} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
      </Routes>
    </Layout>
  );
}
