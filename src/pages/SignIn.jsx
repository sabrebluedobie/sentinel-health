import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // If already signed in, skip the form
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) nav(from, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    // small nicety: trim email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      // Surface common cases nicely
      if (/Invalid login credentials/i.test(error.message)) {
        setMsg("Incorrect email or password.");
      } else if (/Email not confirmed/i.test(error.message)) {
        setMsg("Please confirm your email, then try signing in.");
      } else {
        setMsg(error.message || "Sign-in failed.");
      }
      return;
    }

    if (data?.user) nav(from, { replace: true });
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

        <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className="label">Email</label>
            <input
              className="input mt-1"
              type="email"
              inputMode="email"
              autoComplete="email"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-2 text-center text-xs text-zinc-500">
            <Link to="/sign-up" className="underline">Create an account</Link> ·{" "}
            <Link to="/reset" className="underline">Forgot password?</Link>
          </p>
        </form>
      </div>
    </div>
  );
}