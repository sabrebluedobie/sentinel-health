// sentinel-health/src/pages/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const logo = "/logo.png"; // Ensure logo path is correct

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/signin");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Welcome{user?.email ? `, ${user.email}` : ""}
        </h1>
        <button className="border px-3 py-2 rounded" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      <p className="mt-4">
        Go to{" "}
        <a className="text-blue-600 underline" href="/log-migraine">
          Log Migraine
        </a>
      </p>
    </div>
  );
}