import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthContext.jsx";

const AUTH = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user && !AUTH.has(loc.pathname)) {
    return <Navigate to="/sign-in" replace state={{ from: loc }} />;
  }
  return children;
}