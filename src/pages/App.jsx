import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import SignIn from "@/pages/SignIn.jsx";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/sign-in" element={<SignIn />} />

      {/* Private (wrapped in Layout) */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/log-glucose"  element={<ProtectedRoute><Layout><LogGlucose /></Layout></ProtectedRoute>} />
      <Route path="/log-sleep"    element={<ProtectedRoute><Layout><LogSleep /></Layout></ProtectedRoute>} />
      <Route path="/log-migraine" element={<ProtectedRoute><Layout><LogMigraine /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}