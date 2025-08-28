import React, { useState } from "react";
import { supabase } from "../lib/supabase-browser";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Sentinel Health";
const LOGO_PATH = import.meta.env.VITE_APP_LOGO || "/logo.png";

export default function SignIn() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = `${window.location.origin}/#/`;

  async function doGoogle() {
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if (error) { setMsg(`Google sign-in error: ${error.message}`); setBusy(false); }
  }

  async function doSignIn(e) {
    e.preventDefault();
    setMsg(""); setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    if (error) setMsg(`Sign-in error: ${error.message}`);
    if (data?.session) window.location.hash = "#/";
    setBusy(false);
  }

  async function doSignUp(e) {
    e.preventDefault();
    setMsg(""); 
    if (pwd.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pwd !== pwd2) return setMsg("Passwords do not match.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password: pwd,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) setMsg(`Sign-up error: ${error.message}`);
    else {
      // If email confirmations are ON, user must confirm first.
      setMsg("Account created. Check your email to confirm and sign in.");
      setMode("signin");
    }
    setBusy(false);
  }

  async function doReset(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo // when the user clicks the email link, they'll come back here
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
          <Tab label="Sign in"
