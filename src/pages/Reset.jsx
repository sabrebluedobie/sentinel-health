import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function Reset(){
  const [email,setEmail] = useState("");
  const [msg,setMsg] = useState(""); const [ok,setOk] = useState(""); const [busy,setBusy] = useState(false);

  async function onSubmit(e){
    e.preventDefault(); setBusy(true); setMsg(""); setOk("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`
    });
    setBusy(false);
    if(error){ setMsg(error.message || "Could not send reset email"); return; }
    setOk("Check your email for the reset link.");
  }

  return (
    <div className="app-shell flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold text-center">Reset your password</h1>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          {ok  && <p className="text-sm text-emerald-600">{ok}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      </div>
    </div>
  );
}x