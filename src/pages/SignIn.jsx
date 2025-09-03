// src/pages/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import TopNav from "@/components/TopNav.jsx";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    nav("/", { replace: true });
  }

  async function signInWithGoogle() {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setMsg(error.message);
  }

  // src/pages/SignIn.jsx (essentials only)
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
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  </div>
);
}
