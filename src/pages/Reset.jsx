import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function send(e){
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sign-in`,
    });
    setMsg(error ? error.message : "Check your email for a reset link.");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={send} className="card w-full max-w-md">
        <h1 className="h1 mb-2">Reset password</h1>
        <input className="input mb-3" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <button className="btn primary w-full" type="submit">Send reset link</button>
        {msg ? <p className="mt-2 text-sm text-slate-600">{msg}</p> : null}
      </form>
    </main>
  );
}