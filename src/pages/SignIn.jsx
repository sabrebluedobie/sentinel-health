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

  return (
    <>
      <TopNav showTabs={false} />
      <main className="min-h-[calc(100vh-56px)] grid place-items-center bg-slate-100 px-4">
        <div className="card w-full max-w-md">
          <div className="mb-1 flex items-center gap-2">
            <img src="/logo.png" alt="Sentinel Health" className="h-7 w-auto" />
            <span className="text-sm text-slate-500">Sentinel Health</span>
          </div>
          <h1 className="mb-1 text-2xl font-semibold">Sign into Sentinel Health</h1>
          <p className="mb-4 text-slate-500">Welcome back</p>


          <div className="my-4 text-center text-sm text-slate-400">or</div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2 rounded-xl">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="space-x-2">
              <Link to="/sign-up" className="text-blue-600 hover:underline">Create account</Link>
              <Link to="/reset-password" className="text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <Link to="/" className="text-slate-500 hover:underline">Go home</Link>
          </div>

          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
        </div>
      </main>
    </>
  );
}
