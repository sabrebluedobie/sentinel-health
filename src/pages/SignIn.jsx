// src/pages/SignIn.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandBar from "@/components/BrandBar";
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
import "/logo.png";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  async function signIn(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
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
  // src/pages/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  async function signIn(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
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

  return (
    <main className="min-h-screen grid place-items-center bg-[var(--color-brand-100,#f5f7fb)]">
      <form onSubmit={signIn} className="card w-full max-w-md">
        <img src="/logo.png" alt="Sentinel Health" className="mx-auto mb-4 h-12 w-auto" />
        <h1 className="text-2xl font-semibold text-center mb-1">Sign into Sentinel Health</h1>
        <p className="text-center text-slate-500 mb-4">Welcome back</p>

        <button type="button" onClick={signInWithGoogle} disabled={busy}
                className="btn w-full mb-3"
                style={{ background: "#042d4d", color: "#fff", height: 44, borderRadius: 12 }}>
          Continue with Google
        </button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 my-3">
          <div className="h-px bg-slate-200" /><span className="text-slate-400 text-sm">or</span><div className="h-px bg-slate-200" />
        </div>

        <label className="text-sm font-medium">Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
               className="input w-full mb-2"
               style={{ height: 44, borderRadius: 12, border: "1px solid #e5e7eb", padding: "10px 12px", background: "#ececec" }} />

        <label className="text-sm font-medium">Password</label>
        <input type="password" value={pw} onChange={(e)=>setPw(e.target.value)} required
               className="input w-full"
               style={{ height: 44, borderRadius: 12, border: "1px solid #e5e7eb", padding: "10px 12px", background: "#ececec" }} />

        <button type="submit" disabled={busy}
                className="btn primary w-full mt-4"
                style={{ height: 44, borderRadius: 12, background: "#466dc2", borderColor: "#2563eb" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex justify-between mt-3 text-[14px]">
          <Link to="/sign-up" className="text-blue-600">Create account</Link>
          <Link to="/reset-password" className="text-blue-600">Forgot password?</Link>
        </div>

        <div className="text-center mt-4 text-slate-500">
          <Link to="/">Go home</Link>
        </div>

        <div className="text-red-600 text-sm mt-3" aria-live="polite">{msg}</div>
      </form>
    </main>
  );
}

  return (
    <>
      <BrandBar />
      <main className="min-h-[calc(100vh-60px)] bg-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
          <div className="card w-full max-w-md">
            <div className="mb-1 flex items-center gap-2">
              <img src="/logo.png" alt="Sentinel Health" className="h-6 w-auto" />
              <span className="text-sm text-slate-500">Sentinel Health</span>
            </div>
            <h1 className="mb-1 text-2xl font-semibold">Sign into Sentinel Health</h1>
            <p className="mb-6 text-slate-500">Welcome back</p>

            <button className="btn w-full rounded-xl bg-slate-900 py-2 text-white hover:opacity-90">
              Continue with Google
            </button>

            <div className="my-4 text-center text-sm text-slate-400">or</div>

            <form className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" className="input mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary w-full py-2">Sign in</button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="space-x-2">
                <Link to="/signup" className="text-blue-600 hover:underline">Create account</Link>
                <Link to="/forgot" className="text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <Link to="/" className="text-slate-500 hover:underline">Go home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
