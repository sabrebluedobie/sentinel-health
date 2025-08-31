import React, { useState } from "react";

export default function Settings() {
  const [nightscoutUrl, setNightscoutUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [msg, setMsg] = useState("");

  function save(e) {
    e.preventDefault();
    // TODO: POST to your /api route or Supabase table for settings
    setMsg("Saved ✓ (placeholder — wire to your /api when ready)");
  }

  return (
    <main className="center-wrap">
      <form className="card" onSubmit={save}>
        <img src="/logo.png" alt="Sentinel Health" className="logo" />
        <h1 className="h1">Settings</h1>

        <label className="label">Nightscout URL</label>
        <input className="input" type="url" value={nightscoutUrl} onChange={e=>setNightscoutUrl(e.target.value)} placeholder="https://example.herokuapp.com" />

        <label className="label">API Secret</label>
        <input className="input" type="password" value={apiSecret} onChange={e=>setApiSecret(e.target.value)} />

        <div className="row">
          <button className="btn" type="button" onClick={()=>{ setNightscoutUrl(""); setApiSecret(""); setMsg(""); }}>Clear</button>
          <button className="btn primary" type="submit">Save</button>
        </div>

        <div className="label" style={{ color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
