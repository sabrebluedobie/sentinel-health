// src/pages/SignIn.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import supabase from "@/lib/supabase"; // standardize to default import

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message || "Sign-in failed");
    navigate(from, { replace: true });
  }

  return (
    <div className="app-shell grid place-items-center p-6">
      <div className="w-full max-w-md card">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="Sentinel Health" className="logo-img" />
          <div>
            <h1 className="text-lg font-semibold">Sign in to Sentinel Health</h1>
            <p className="text-sm text-zinc-500">Welcome back</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-2 text-center text-xs text-zinc-500">
            <Link to="/sign-up" className="underline">Create an account</Link> ·{" "}
            <Link to="/sign-in?mode=reset" className="underline">Forgot password?</Link>
          </p>
        </form>
      </div>
    </div>
  );
}