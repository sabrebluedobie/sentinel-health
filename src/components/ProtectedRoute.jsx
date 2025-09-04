import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthContext.jsx"; // <-- change this line

const AUTH_PATHS = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(); // <-- use the hook
  const location = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user && !AUTH_PATHS.has(location.pathname)) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  return children;
}