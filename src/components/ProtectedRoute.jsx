// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext"; // adjust path if your context lives elsewhere

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; // or a spinner component
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location }} />;

  return children;
}