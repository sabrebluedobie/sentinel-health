import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setBusy(false);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={logo} alt="Logo" className="w-10 h-10"/>
          <h1 className="h1">Sign in</h1>
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />

          <label className="label" htmlFor="pwd">Password</label>
          <input id="pwd" className="input" type="password"
                 value={pwd} onChange={(e)=>setPwd(e.target.value)} required />

          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-4">
          No account?{" "}
          <Link to="/sign-up" className="text-brand-700 hover:text-brand-900 underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
