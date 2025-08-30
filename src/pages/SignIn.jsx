// src/pages/SignIn.jsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Optional: auto sign-in after signup if your auth settings allow
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset",
        });
        if (error) throw error;
        setMode("signin");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 16, background: "#fff", borderRadius: 12 }}>
      <h1 style={{ fontWeight: 700, marginBottom: 8 }}>
        {mode === "signup" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}
      </h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        {mode !== "reset" && (
          <>
            <label>Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            />
          </>
        )}

        {error && <p style={{ color: "#d00", marginBottom: 12 }}>{error}</p>}

        <button disabled={submitting} style={{ width: "100%", padding: 10 }}>
          {submitting ? "Working…" : mode === "signup" ? "Sign up" : mode === "reset" ? "Send reset link" : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        {mode !== "signup" && <button onClick={() => setMode("signup")}>Create account</button>}
        {mode !== "reset" && <button onClick={() => setMode("reset")}>Forgot password?</button>}
        {mode !== "signin" && <button onClick={() => setMode("signin")}>Back to sign in</button>}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link to="/">Go home</Link>
      </div>
    </div>
  );
}
