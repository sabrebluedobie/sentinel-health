import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const AUTH_PATHS = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;
  if (!user && !AUTH_PATHS.has(location.pathname)) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  return children;
}