import React, { useState } from "react";
import supabase from '@/lib/supabase'
import { Link, useNavigate, useLocation } from "react-router-dom";
import "/logo.png";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setBusy(false);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-brand-100">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-semibold text-brand-900">Create account</h1>
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
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm">
          Already have an account? <Link to="/sign-in" className="text-blue-600 underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
