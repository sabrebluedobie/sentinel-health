// src/components/SignIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import logo from "../assets/logo.png"; // make sure file exists
// src/pages/SignIn.jsx
export { default } from "../components/SignIn.jsx";


const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = () =>
    typeof window !== "undefined" ? `${window.location.origin}/` : "/";

  async function doGoogle() {
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() }
    });
    if (error) {
      setMsg(`Google sign-in error: ${error.message}`);
      setBusy(false);
    }
  }

  async function doSignIn(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd
    });
    if (error) setMsg(`Sign-in error: ${error.message}`);
    if (data?.session) navigate("/", { replace: true });
    setBusy(false);
  }

  async function doSignUp(e) {
    e.preventDefault();
    setMsg("");
    if (pwd.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pwd !== pwd2) return setMsg("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: { emailRedirectTo: redirectTo() }
    });
    if (error) setMsg(`Sign-up error: ${error.message}`);
    else {
      setMsg("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
    }
    setBusy(false);
  }

  async function doReset(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo()
    });
    setBusy(false);
    setMsg(error ? `Reset error: ${error.message}` : "Password reset email sent. Check your inbox.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandWrap}>
          <img src={LOGO_PATH} alt="Logo" style={styles.logo} />
          <div style={styles.brandName}>{APP_NAME}</div>
        </div>

        <div style={styles.tabs}>
          <Tab label="Sign in" active={mode === "signin"} onClick={() => setMode("signin")} />
          <Tab label="Create account" active={mode === "signup"} onClick={() => setMode("signup")} />
          <Tab label="Reset" active={mode === "reset"} onClick={() => setMode("reset")} />
        </div>

        {mode === "signin" && (
          <form onSubmit={doSignIn} style={styles.form} autoComplete="on">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoFocus
              autoComplete="email"
              name="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={pwd}
              onChange={setPwd}
              autoComplete="current-password"
              name="current-password"
            />
            <button type="submit" disabled={busy} style={styles.primaryBtn}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={doSignUp} style={styles.form} autoComplete="on">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              name="email"
            />
            <Input
              type="password"
              placeholder="Create password (min 8 chars)"
              value={pwd}
              onChange={setPwd}
              autoComplete="new-password"
              name="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={pwd2}
              onChange={setPwd2}
              autoComplete="new-password"
              name="new-password-confirm"
            />
            <button type="submit" disabled={busy} style={styles.primaryBtn}>
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={doReset} style={styles.form} autoComplete="on">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              name="email"
            />
            <button type="submit" disabled={busy} style={styles.primaryBtn}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div style={styles.divider}><span>or</span></div>

        <button onClick={doGoogle} disabled={busy} style={styles.googleBtn}>
          Continue with Google
        </button>

        <div style={styles.msg}>{msg}</div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>
      {label}
    </button>
  );
}

function Input({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.input}
      required
    />
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7fb", padding: 16 },
  card: { width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #eee", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.06)", padding: 24 },
  brandWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 12 },
  logo: { height: 56, width: "auto" },
  brandName: { fontSize: 20, fontWeight: 700 },
  tabs: { display: "flex", gap: 8, margin: "8px 0 16px" },
  tab: { flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10, background: "#fafafa", cursor: "pointer" },
  tabActive: { background: "#fff", borderColor: "var(--primary, #1a73e8)", fontWeight: 600 },
  form: { display: "grid", gap: 10 },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", outline: "none" },
  primaryBtn: { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--primary, #1a73e8)", background: "var(--primary, #1a73e8)", color: "#fff", cursor: "pointer" },
  googleBtn: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  divider: { display: "flex", alignItems: "center", gap: 8, margin: "14px 0", color: "#999", fontSize: 12 },
  msg: { marginTop: 10, color: "#666", minHeight: 18 }
};
