import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner
  if (!user) {
    // keep where they were going so we can return them post-login
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  return children;
}