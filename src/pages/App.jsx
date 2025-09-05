import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import SignIn from "@/pages/SignIn.jsx";
import Dashboard from "@/pages/Dashboard.jsx"; // your existing dashboard
// (Optional) the three log pages if already created:
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import Layout from "@/layout"; // if you have one; otherwise remove wrapper

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/sign-in" element={<SignIn />} />

      {/* private dashboard */}
      <Route
        path="/app"
        element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>}
      />

      {/* optional private forms */}
      <Route path="/log-glucose"  element={<ProtectedRoute><Layout><LogGlucose /></Layout></ProtectedRoute>} />
      <Route path="/log-sleep"    element={<ProtectedRoute><Layout><LogSleep /></Layout></ProtectedRoute>} />
      <Route path="/log-migraine" element={<ProtectedRoute><Layout><LogMigraine /></Layout></ProtectedRoute>} />

      {/* defaults */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}