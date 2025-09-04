//*v1.0*//
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "@/components/AuthContext.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import Layout from "@/layout";

import SignIn from "@/pages/SignIn.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";
import Settings from "@/pages/Settings.jsx";
import NotFound from "@/pages/NotFound.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/sign-in"
        element={user ? <Navigate to="/app" replace /> : <SignIn />}
      />

      {/* Private (inside Layout) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/log-glucose"
        element={
          <ProtectedRoute>
            <Layout>
              <LogGlucose />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-sleep"
        element={
          <ProtectedRoute>
            <Layout>
              <LogSleep />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-migraine"
        element={
          <ProtectedRoute>
            <Layout>
              <LogMigraine />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default / 404 */}
      <Route path="/" element={<Navigate to={user ? "/app" : "/sign-in"} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}