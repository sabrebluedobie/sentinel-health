// src/pages/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout";
import Dashboard from "@/pages/Dashboard.jsx";
import SignIn from "@/pages/SignIn.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import { useAuth } from "@/components/AuthContext.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />

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
          path="/log-migraine"
          element={
            <ProtectedRoute>
              <LogMigraine />
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
          path="/log-glucose"
          element={
            <ProtectedRoute>
              <LogGlucose />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
      </Routes>
    </Layout>
  );
}
