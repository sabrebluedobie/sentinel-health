// src/pages/SignIn.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Optional: set a custom logo via VITE_APP_LOGO; falls back to /logo.png (public/)
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  // support ?next=/path so protected pages can bounce here and back
  const next = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const n = sp.get("next");
    // basic safety: only allow same-origin paths
    return n && n.startsWith("/") ? n : "/";
  }, [location.search]);

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (confirm !== password) throw new Error("Passwords do not match.");

        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;

        // If email confirmation is required, the user won't be logged in yet.
        // Try a normal sign-in; if it fails, show a friendly message.
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          setSubmitting(false);
          return;
        }
        navigate(next, { replace: true });
        return;
      }

      if (mode === "reset") {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset`,
        });
        if (resetErr) throw resetErr;
        setNotice("Password reset email sent. Check your inbox.");
        setMode("signin");
        setSubmitting(false);
        return;
      }

      // mode === 'signin'
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      navigate(next, { replace: true });
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl shadow-sm p-6 bg-white">
        <div className="flex items-center justify-center mb-4">
          <img src={LOGO_PATH} alt="App logo" style={{ height: 48 }} />
        </div>

        <h1 className="text-xl font-semibold text-center mb-1">
          {mode === "signup" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          {mode === "signup"
            ? "Join Sentinel Health"
            : mode === "reset"
            ? "We’ll email you a secure link"
            : "Welcome back"}
        </p>

        {notice ? <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 p-2 rounded">{notice}</div> : null}
        {error ? <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div> : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              className="mt-1 w-full border rounded px-3 py-2"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {mode !== "reset" && (
            <>
              <label className="block">
                <span className="text-sm">Password</span>
                <input
                  type="password"
                  className="mt-1 w-full border rounded px-3 py-2"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {mode === "signup" && (
                <label className="block">
                  <span className="text-sm">Confirm password</span>
                  <input
                    type="password"
                    className="mt-1 w-full border rounded px-3 py-2"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </label>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {submitting
              ? "Working…"
              : mode === "signup"
              ? "Create account"
              : mode === "reset"
              ? "Send reset link"
              : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          {mode !== "signup" && (
            <button className="underline" onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>
              Create account
            </button>
          )}
          {mode !== "reset" && (
            <button className="underline" onClick={() => { setMode("reset"); setError(""); setNotice(""); }}>
              Forgot password?
            </button>
          )}
          {mode !== "signin" && (
            <button className="underline" onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>
              Back to sign in
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link to="/">Go home</Link>
        </div>
      </div>
    </div>
  );
}
