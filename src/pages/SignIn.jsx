import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    navigate(from, { replace: true });
  }

  return (
    <div className="app-shell grid place-items-center min-h-screen px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-4">
          <img src="/logo.svg" alt="Sentrya" className="logo-img mx-auto" />
          <h1 className="text-xl font-semibold mt-2">Sign in to Sentrya</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <label className="label mt-2">Password</label>
          <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {msg && <div className="text-red-600 text-sm">{msg}</div>}
          <button disabled={busy} className="btn-primary w-full mt-3" type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm text-zinc-500 mt-4">
          <Link to="/">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}