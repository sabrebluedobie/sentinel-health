import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location }} />;

  return children;
}
