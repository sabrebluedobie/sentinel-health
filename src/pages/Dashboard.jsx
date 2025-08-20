// src/pages/Dashboard.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png"; // keep or remove if unused

export default function Dashboard() {
  const { user, loading } = useAuth?.() ?? { user: null, loading: false };
  const navigate = useNavigate();

  // If you're not using a ProtectedRoute, gently redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in", { replace: true });
    }
  }, [loading, user, navigate]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  };

  if (loading || !user) {
    // Render nothing or a small placeholder while checking auth
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Welcome{user?.email ? `, ${user.email}` : ""}
        </h1>
        <button className="btn-ghost" onClick={onSignOut}>Sign out</button>
      </div>

      {/* Content ... */}
      {/* Example: <img src={logo} alt="Sentinel Health" className="h-10" /> */}
    </div>
  );
}
