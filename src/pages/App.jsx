// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import SignIn from "@/components/SignIn";
import Dashboard from "./pages/Dashboard";
import LogGlucose from "./pages/LogGlucose";
import LogSleep from "./pages/LogSleep";
import LogMigraine from "./pages/LogMigraine";



export default function App() {
  return (
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
