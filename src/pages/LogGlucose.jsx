import React, { useState } from "react";
import supabase from "@/lib/supabase";

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function LogGlucose() {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const uid = await getUid();
    if (!uid) return setMsg("Not signed in.");

    const mgdl = Number(value);
    if (!Number.isFinite(mgdl) || mgdl < 20 || mgdl > 600) {
      return setMsg("Please enter a glucose value between 20 and 600 mg/dL.");
    }

    setSaving(true);
    const { error } = await supabase.from("glucose_readings").insert({
      user_id: uid,
      device_time: new Date().toISOString(),
      value_mgdl: mgdl,
      trend: null,
      source: "manual",
      note: note || null,
      created_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) return setMsg(`Save failed: ${error.message}`);
    setValue(""); setNote("");
    setMsg("Saved ✓");
  }

  return (
    <main className="center-wrap">
      <form className="card" onSubmit={submit}>
        <img src="/logo.png" alt="Sentinel Health" className="logo" />
        <h1 className="h1">Log Glucose</h1>

        <label className="label">Value (mg/dL)</label>
        <input className="input" type="number" min="20" max="600" value={value} onChange={e=>setValue(e.target.value)} required />

        <label className="label">Note (optional)</label>
        <input className="input" type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g., after lunch" />

        <div className="row">
          <button className="btn" type="button" onClick={()=>{ setValue(""); setNote(""); }}>Clear</button>
          <button className="btn primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        </div>

        <div className="label" style={{ color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
