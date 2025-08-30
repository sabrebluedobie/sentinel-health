// src/pages/SignIn.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

/**
 * Card-style Sign In
 * - Uses /assets/logo.png (falls back to /logo.png if missing)
 * - Email/Password Sign In + Sign Up + Reset
 * - "Continue with Google" OAuth
 * - Autocomplete-friendly inputs
 * - Accepts ?next=/path and persists it across OAuth via sessionStorage
 * - Accepts <SignIn initialMode="signup" /> to preselect the signup view
 */
export default function SignIn({ initialMode = "signin" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const next = useMemo(() => {
    const n = new URLSearchParams(location.search).get("next");
    return n && n.startsWith("/") ? n : "/";
  }, [location.search]);

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Logo fallback: if /assets/logo.png 404s, try /logo.png
  function onLogoError(e) {
    const img = e.currentTarget;
    if (!img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = "/logo.png";
    }
  }

  async function handleGoogle() {
    setError("");
    setNotice("");
    try {
      sessionStorage.setItem("oauth_next", next);
    } catch {}
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

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

        // Try to sign in immediately; if confirmation required, inform user
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

  // Inline card styles so login looks good even if global CSS hasn’t loaded yet
  const wrap = {
    minHeight: "100vh",
    background: "#ececec",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };
  const card = {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,.08)",
    padding: 24,
  };
  const label = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 };
  const input = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
  };
  const button = {
    width: "100%",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    border: 0,
    cursor: "pointer",
  };
  const buttonGhost = {
    width: "100%",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#fff",
    color: "#111827",
    fontWeight: 600,
    border: "1px solid #d1d5db",
    cursor: "pointer",
  };

  return (
    <div style={wrap}>
      <div style={card} aria-label="Sign in card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <img src="/assets/logo.png" alt="App logo" style={{ height: 48 }} onError={onLogoError} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4 }}>
          {mode === "signup" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 12 }}>
          {mode === "signup" ? "Join Sentinel Health" : mode === "reset" ? "We’ll email you a secure link" : "Welcome back"}
        </p>

        {notice && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              padding: 8,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: 8,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <button type="button" onClick={handleGoogle} style={buttonGhost}>
          Continue with Google
        </button>

        <div style={{ textAlign: "center", margin: "10px 0", color: "#9ca3af", fontSize: 12 }}>or</div>

        <form onSubmit={handleSubmit} autoComplete="on" style={{ display: "grid", gap: 12 }}>
          <label style={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            style={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode !== "reset" && (
            <>
              <label style={label} htmlFor="password">
                {mode === "signup" ? "Create password" : "Password"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                style={input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          {mode === "signup" && (
            <>
              <label style={label} htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                style={input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </>
          )}

          <button type="submit" style={button} disabled={submitting}>
            {submitting
              ? "Working…"
              : mode === "signup"
              ? "Create account"
              : mode === "reset"
              ? "Send reset link"
              : "Sign in"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
            marginTop: 10,
            fontSize: 14,
          }}
        >
          {mode !== "signup" && (
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setNotice("");
              }}
              style={{ background: "transparent", border: 0, color: "#2563eb", cursor: "pointer" }}
            >
              Create account
            </button>
          )}
          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError("");
                setNotice("");
              }}
              style={{ background: "transparent", border: 0, color: "#2563eb", cursor: "pointer" }}
            >
              Forgot password?
            </button>
          )}
          {mode !== "signin" && (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setNotice("");
              }}
              style={{ background: "transparent", border: 0, color: "#2563eb", cursor: "pointer" }}
            >
              Back to sign in
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 10, fontSize: 14 }}>
          <Link to="/" style={{ color: "#6b7280" }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
