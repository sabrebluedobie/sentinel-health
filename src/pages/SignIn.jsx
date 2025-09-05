import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import supabase from "@/lib/supabase";

const AUTH = new Set(["/sign-in","/sign-up","/reset"]);

export default function SignIn() {
  const navigate = useNavigate();
  const loc = useLocation();
  const rawFrom = loc.state?.from?.pathname || "/";
  const from = AUTH.has(rawFrom) ? "/" : rawFrom;

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) return setMsg(error.message || "Sign-in failed");
    if (data?.user) navigate(from, { replace: true });
  }

  return (
    <div className="app-shell grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md">
        <div className="text-center mb-4">
          <img src="/logo.png" alt="Sentinel Health" className="mx-auto h-12 w-auto" />
          <h1 className="text-xl font-semibold mt-2">Sign in</h1>
        </div>

        <label className="label mt-2">Email</label>
        <input className="input" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label className="label mt-3">Password</label>
        <input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e)=>setPw(e.target.value)} required />

        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}

        <button className="btn-primary w-full mt-4" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>

        <p className="mt-3 text-center text-xs text-zinc-500">
          <Link to="/reset" className="underline">Forgot password?</Link>
        </p>
      </form>
    </div>
  );
}