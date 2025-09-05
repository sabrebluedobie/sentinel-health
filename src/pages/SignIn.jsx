import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

const AUTH = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();
  const rawFrom = loc.state?.from?.pathname || "/app";
  const from = AUTH.has(rawFrom) ? "/app" : rawFrom;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(), password
    });

    setBusy(false);
    if (error) { setMsg(error.message || "Sign-in failed"); return; }
    if (data?.user) nav(from, { replace: true });
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md">
        <h1 className="text-xl font-semibold text-center">Sign in</h1>

        <label className="label mt-4">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

        <label className="label mt-3">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}

        <button className="btn-primary w-full mt-4" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-3 text-center text-xs text-zinc-500">
          <Link to="/reset" className="underline">Forgot password?</Link>
        </p>
      </form>
    </main>
  );
}