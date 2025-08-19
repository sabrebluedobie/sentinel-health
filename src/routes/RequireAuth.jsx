import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location }} />;

  return children;
}
