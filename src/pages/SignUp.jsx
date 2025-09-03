import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignUp() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setOk("");
    if (password !== confirm) {
      setMsg("Passwords do not match"); return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/sign-in`
      }
    });
    setBusy(false);
    if (error) { setMsg(error.message || "Sign up failed"); return; }
    setOk("Check your email to confirm your account. After confirming, sign in.");
    // Optional: nav("/sign-in"); // if you don't require email confirmations
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Sentinel Health" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Sentinel Health</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" required
                   value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1" type="password" required
                   value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input mt-1" type="password" required
                   value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}
          {ok  && <p className="text-sm text-emerald-600">{ok}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>

          <p className="mt-2 text-center text-xs text-zinc-500">
            Already have an account? <Link to="/sign-in" className="underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}