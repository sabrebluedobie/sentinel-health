import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // If already signed in, bounce to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/migraine-icon.png" alt="Sentrya Migraine Tracker" className="h-20 w-auto mb-3" />
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">Sentrya</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">Migraine Tracker</div>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-medium text-zinc-900 mb-1">Sign in</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Welcome back. Use your email and password to continue.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/reset" className="text-blue-700 hover:underline">Forgot password?</Link>
            <Link to="/sign-up" className="text-zinc-600 hover:underline">Create account</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By continuing you agree to Sentrya's Terms & Privacy.
        </p>
      </div>
    </div>
  );
}
