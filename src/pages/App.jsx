import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import SignIn from "@/pages/SignIn.jsx";

// Your existing pages
import Dashboard from "@/pages/Dashboard.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public route: sign-in */}
      <Route path="/sign-in" element={<SignIn />} />

      {/* Protected application */}
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}