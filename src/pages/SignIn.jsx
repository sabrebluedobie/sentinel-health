import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up", "/reset"]);

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();

  // sanitize the "from" path so we never loop to another auth page
  const rawFrom = loc.state?.from?.pathname || "/app";
  const from = AUTH_ROUTES.has(rawFrom) ? "/app" : rawFrom;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message || "Sign-in failed");
      return;
    }

    if (data?.user) {
      // ✅ go back to the original target (e.g., /log-migraine)
      nav(from, { replace: true });
    }
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sign in to Sentinel Health</h1>
          {loc.state?.from?.pathname && (
            <p className="mt-1 text-xs text-zinc-500">
              You’ll be returned to <code className="px-1 rounded bg-zinc-100">{from}</code> after login.
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" value={email}
                   onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1" type="password" value={password}
                   onChange={(e)=>setPassword(e.target.value)} required />
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