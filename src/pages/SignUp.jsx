import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setMsg("Check your email to confirm your account.");
      // optionally: navigate("/sign-in");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-lg p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
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
