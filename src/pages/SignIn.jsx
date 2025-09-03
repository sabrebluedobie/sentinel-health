import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message || "Sign-in failed");
      return;
    }

    if (data?.user) {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Sentinel Health" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Sign in to Sentinel Health
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}