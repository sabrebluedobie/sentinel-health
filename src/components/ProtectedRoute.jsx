import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// auth routes you should NEVER redirect away from
const AUTH_ROUTES = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;

  if (!user) {
    // If the current page is already an auth page, don't redirect (prevents loops)
    if (AUTH_ROUTES.has(location.pathname)) {
      return children;
    }
    // Only pass "from" when it's not an auth page (prevents flipping back)
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return children;
}