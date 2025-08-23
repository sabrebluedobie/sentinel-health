// src/pages/SignIn.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
    <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-lg p-6 bg-white shadow-sm"
        aria-labelledby="signin-title"
      >
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Sentinel Health" width={100} height={100} />
          <h1 id="signin-title" className="text-xl font-semibold text-gray-900 text-center">
            Sentinel Health | Migraine Tracker
          </h1>
        </div>

        {errorMsg && (
          <p className="text-red-600 text-sm" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="space-y-3">
          <input
            className="w-full border rounded p-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-sm text-center">
          No account?{" "}
          <Link to="/sign-up" className="text-blue-600 underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}