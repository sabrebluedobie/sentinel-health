import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message || "Sign-in failed");
    const to = location.state?.from?.pathname ?? "/";
    navigate(to, { replace: true });
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-600/10 grid place-content-center">
                <span className="text-brand-700 font-bold">SH</span>
              </div>
              <div>
                <h1 className="text-xl">Sign in to Sentinel Health</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Welcome back—please use your tester credentials.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  className="input mt-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <input
                  className="input mt-1"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {msg && (
                <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Having trouble? Contact an admin for a password reset.
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}