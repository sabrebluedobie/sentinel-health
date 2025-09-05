import React from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext.jsx";

export default function Layout({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 bg-white/90 backdrop-blur z-10 border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
           <div className="text-lg font-semibold tracking-wide">Sentrya</div>
{/* OR */}
<img src="/logo.svg" alt="Sentrya" className="h-7 w-auto" />
          <nav className="flex gap-2 text-sm">
            <Link className="btn-ghost" to="/">Dashboard</Link>
            <Link className="btn-ghost" to="/log-glucose">Glucose</Link>
            <Link className="btn-ghost" to="/log-sleep">Sleep</Link>
            <Link className="btn-ghost" to="/log-migraine">Migraine</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-zinc-500">{user?.email}</span>
            <button onClick={signOut} className="btn-primary">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}