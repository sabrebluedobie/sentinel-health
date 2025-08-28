import React, { useState } from "react";
import { supabase } from "../../lib/supabase-browser";
import logo from "../assets/logo.png";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const redirectTo = `${window.location.origin}/`; // comes back to Home/Dashboard

  const magicLink = async (e) => {
    e.preventDefault();
    setMsg("Sending magic link…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    setMsg(error ? `Error: ${error.message}` : "Check your email for a sign-in link.");
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if (error) setMsg(`Error: ${error.message}`);
  };

  return (
    <div style={styles.wrap}>
      <h1>Sign in</h1>
      <form onSubmit={magicLink} style={styles.form}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.primary}>Send magic link</button>
      </form>
      <div style={{ marginTop: 10, color: "#666" }}>{msg}</div>

      <div style={{ margin: "16px 0" }}>
        <div style={{ color: "#999", fontSize: 12, marginBottom: 6 }}>or</div>
        <button onClick={google} style={styles.secondary}>Continue with Google</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 420, margin: "48px auto", padding: "0 16px" },
  form: { display: "flex", gap: 10, alignItems: "center" },
  input: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" },
  primary: { padding: "10px 12px", borderRadius: 10, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff", cursor: "pointer" },
  secondary: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer" }
};
