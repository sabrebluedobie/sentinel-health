// src/pages/SignIn.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/log-migraine.css"; // reuse container/card/btn/etc. tokens

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) {
        console.error(error);
        setErrorMsg(error.message);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page container">
      <form
        onSubmit={onSubmit}
        className="card card--elevated"
        aria-labelledby="signin-title"
      >
        <h2 id="signin-title" className="h2">Sign in</h2>

        <div className="row row--center" style={{ justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
          <img src={logo} alt="Sentinel Health" width={64} height={64} />
          <div className="muted" style={{ fontSize: "14px" }}>
            Sentinel Health&nbsp;|&nbsp;Migraine Tracker
          </div>
        </div>

        {errorMsg ? (
          <div className="alert alert--error" role="alert" style={{ marginBottom: "8px" }}>
            {errorMsg}
          </div>
        ) : null}

        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          type="password"
          className="input"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <div className="actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            <span className="btn__text">{busy ? "Signing in…" : "Sign in"}</span>
          </button>
        </div>

        <p className="small" style={{ textAlign: "center", marginTop: "10px" }}>
          No account?{" "}
          <Link to="/sign-up" className="link" style={{ color: "var(--primary)" }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}