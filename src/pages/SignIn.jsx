import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message || "Unable to sign in.");
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="signin-wrap">
      <form className="signin-card" onSubmit={onSubmit}>
        {/* Logo at the top */}
        <img
          src="./public/logo.png"
          alt="Sentinel Health Logo"
          className="signin-logo"
        />

        <h1 className="signin-title">Sign in to Sentinel Health</h1>

        {error && <div className="signin-error">{error}</div>}

        <div className="form-row">
          <label htmlFor="email" className="form-label">Email</label>
          <div className="form-spacer" aria-hidden="true" />
          <input
            id="email"
            type="email"
            className="form-input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="form-spacer" aria-hidden="true" />
          <input
            id="password"
            type="password"
            className="form-input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="signin-btn" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}