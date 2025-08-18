import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logo } from "../assets/logo.png"; // Adjust the path as necessary


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setBusy(false);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-lg p-6">
        <img src={logo} alt="Sentinel Health Logo" className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          className="w-full border rounded p-2"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          type="password"
          required
        />
        <button disabled={busy} className="w-full bg-blue-600 text-white rounded p-2">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm">
          No account? <Link to="/sign-up" className="text-blue-600 underline">Create one</Link>
        </p>
      </form>
    </div>
  );
}
