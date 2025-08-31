// src/pages/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "SignIn.module.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function signInWithGoogle() {
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: {
          prompt: "select_account",   // show selector if already signed in to Google
          access_type: "offline",     // refresh token
        },
      },
    });
    if (error) {
      setMsg(error.message);
      setBusy(false);
    }
    // On success, Supabase redirects; no extra code needed here
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    navigate("/app", { replace: true });
  }

  return (
    <main className="center-wrap" style={{ background: "#ececec" }}>
      <form
        className="card"
        onSubmit={submit}
        style={{ maxWidth: 520, borderRadius: 16, padding: 28 }}
        autoComplete="on"            // ✅ enable browser autofill
        name="signin"                // ✅ helps Chrome profile manager
      >
        <img src="/src/assets/logo.png" alt="Sentinel Health" className="logo" style={{ width: 48, height: 48, borderRadius: 12 }} />

        <h1 className="h1" style={{ marginTop: 8, marginBottom: 4, fontSize: 28, textAlign: "center" }}>Sign into Sentinel Health</h1>
        <div style={{ textAlign: "center", color: "#6b7280", marginBottom: 16 }}>Welcome back</div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="btn"
          disabled={busy}
          style={{ width: "100%", borderRadius: 12, height: 44, fontWeight: 600, 
          color: "#fff",
          background: "#042d4d" }}
        >
          Continue with Google
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ height: 1, background: "var(--card-border)" }} />
          <span style={{ color: "#9ca3af", fontSize: 14 }}>or</span>
          <div style={{ height: 1, background: "var(--card-border)" }} />
        </div>

        <label className="label" htmlFor="email">Email</label>
        <input
          className="input"
          id="email"
          name="email"               // ✅ name + autoComplete make autofill work
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ height: 44, borderRadius: 12,
          backgroundColor: #ececec,
           }}
        />

        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          name="current-password"    // ✅ name aligns with browser’s password manager
          type="password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          style={{ height: 44, borderRadius: 12,
          backgroundColor: #ececec,
           }}
        />

        <button
          className="btn primary"
          type="submit"
          disabled={busy}
          style={{ width: "100%", marginTop: 16, height: 44, borderRadius: 12, background: "#466dc2ff", borderColor: "#2563eb" }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <Link to="/sign-up" style={{ textDecoration: "none", color: "#2563eb" }}>Create account</Link>
          <Link to="/reset-password" style={{ textDecoration: "none", color: "#2563eb" }}>Forgot password?</Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "none" }}>Go home</Link>
        </div>

        <div className="label" style={{ color: msg ? "#b00020" : "transparent", minHeight: 18, marginTop: 10 }}>
          {msg || "."}
        </div>
      </form>
    </main>
  );
}
