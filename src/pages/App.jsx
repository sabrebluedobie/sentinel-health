import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import LogGlucose from "@/pages/LogGlucose.jsx";
import LogSleep from "@/pages/LogSleep.jsx";
import LogMigraine from "@/pages/LogMigraine.jsx";

export default function App() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell bg-zinc-50">
      {/* Header */}
      <header className="bg-white shadow-sm ring-1 ring-black/5">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Sentrya" className="logo-img" />
            <nav className="flex gap-2 text-sm">
              <Link className="btn-ghost no-underline" to="/">
                Dashboard
              </Link>
              <Link className="btn-ghost no-underline" to="/log-glucose">
                Glucose
              </Link>
              <Link className="btn-ghost no-underline" to="/log-sleep">
                Sleep
              </Link>
              <Link className="btn-ghost no-underline" to="/log-migraine">
                Migraine
              </Link>
            </nav>
          </div>
          <div>
            {user ? (
              <button
                onClick={signOut}
                className="btn-ghost text-sm"
              >
                Sign out
              </button>
            ) : (
              <Link to="/sign-in" className="btn-primary text-sm no-underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Routed content */}
      <main className="container-page py-6">
        <Routes>
          {/* Dashboard is public, but shows sign-in message if not logged in */}
          <Route path="/" element={<Dashboard />} />

          {/* Protected forms */}
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
      </main>
    </div>
  );
}