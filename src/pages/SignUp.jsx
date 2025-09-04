import React, { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function SignUp(){
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState(""); const [msg,setMsg] = useState(""); const [ok,setOk] = useState(""); const [busy,setBusy] = useState(false);

  async function onSubmit(e){
    e.preventDefault(); setMsg(""); setOk("");
    if(password !== confirm){ setMsg("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password, options:{ emailRedirectTo: `${window.location.origin}/sign-in` }
    });
    setBusy(false);
    if(error){ setMsg(error.message || "Sign up failed"); return; }
    setOk("Check your email to confirm your account, then sign in.");
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold text-center">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div><label className="label">Email</label><input className="input mt-1" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><label className="label">Password</label><input className="input mt-1" type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div><label className="label">Confirm</label><input className="input mt-1" type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} /></div>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          {ok  && <p className="text-sm text-emerald-600">{ok}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
          <p className="mt-2 text-center text-xs text-zinc-500">Have an account? <Link to="/sign-in" className="underline">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}