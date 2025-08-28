// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/components/AuthContext";
import Header from "@/components/Header";

import Dashboard from "@/pages/Dashboard";
import SignIn from "@/components/SignIn";
import LogGlucose from "@/pages/LogGlucose";
import LogSleep from "@/pages/LogSleep";
import LogMigraine from "@/pages/LogMigraine";

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        {/* Home */}
        <Route path="/" element={<Dashboard />} />

        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />

        {/* Logging pages — canonical lowercase */}
        <Route path="/log-glucose" element={<LogGlucose />} />
        <Route path="/log-sleep" element={<LogSleep />} />
        <Route path="/log-migraine" element={<LogMigraine />} />

        {/* Backwards-compat redirects for any capitalized paths */}
        <Route path="/LogGlucose" element={<Navigate to="/log-glucose" replace />} />
        <Route path="/LogSleep" element={<Navigate to="/log-sleep" replace />} />
        <Route path="/LogMigraine" element={<Navigate to="/log-migraine" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
