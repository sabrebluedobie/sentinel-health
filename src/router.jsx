// src/router.jsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LogMigraine from "./pages/LogMigraine.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import { useAuth } from "./providers/AuthProvider.jsx";
import LogSleep from "./pages/LogSleep.jsx";
import LogGlucose from "./pages/LogGlucose.jsx";


// Small guard to protect private routes
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // public
      { path: "sign-in", element: <SignIn /> },
      { path: "sign-up", element: <SignUp /> },

      // private
      {
        index: true,
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "log-migraine",
        element: (
          <RequireAuth>
            <LogMigraine />
          </RequireAuth>
        ),
      },
      {
  path: "/log-sleep",
  element: (
    <RequireAuth>
      <LogSleep />
    </RequireAuth>
  ),
},
{
  path: "/log-glucose",
  element: (
    <RequireAuth>
      <LogGlucose />
    </RequireAuth>
  ),
},


      // fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
