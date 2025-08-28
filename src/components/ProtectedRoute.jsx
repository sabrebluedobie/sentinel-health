// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="container" style={{ padding: 24 }}>Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}
