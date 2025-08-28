import React, { useContext } from "react";
import "../styles/globals.css";
import "../styles/theme.css";
import { ThemeProvider } from "../components/ThemeContext.jsx";
import { AuthProvider, AuthContext } from "../components/AuthContext.jsx";
import Header from "../components/Header.jsx";
import SignIn from "../components/SignIn.jsx";
import Settings from "../components/Settings.jsx";

import { Routes, Route, Navigate } from "react-router-dom";

// PAGES (match your filenames/casing)
import Dashboard from "./Dashboard.jsx";
import LogGlucose from "./LogGlucose.jsx";
import LogSleep from "./LogSleep.jsx";
import LogMigraine from "./LogMigraine.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/log/glucose"
            element={
              <RequireAuth>
                <LogGlucose />
              </RequireAuth>
            }
          />
          <Route
            path="/log/sleep"
            element={
              <RequireAuth>
                <LogSleep />
              </RequireAuth>
            }
          />
          <Route
            path="/log/migraine"
            element={
              <RequireAuth>
                <LogMigraine onSave={(data) => console.log("migraine saved", data)} />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
