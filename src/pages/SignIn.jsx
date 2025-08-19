import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";
@reference "../../../index.css";
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });
    setBusy(false);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100 p-6">
      <div className="w-full max-w-sm bg-white shadow-soft rounded-xl2 p-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Sentinel Health Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-brand-900 mb-4">
          Sign in
        </h1>

        {/* Error */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3">
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
          <button
            disabled={busy}
            className="w-full bg-brand-500 hover:bg-brand-700 text-white rounded p-2 transition"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          No account?{" "}
          <Link to="/sign-up" className="text-brand-500 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
