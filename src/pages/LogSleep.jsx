import React, { useState } from "react";
import supabase from "@/lib/supabase";

function localToISO(local) {
  if (!local) return null;
  const d = new Date(local.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function localToDate(local) {
  return (local && local.split("T")[0]) || null; // "YYYY-MM-DD"
}
async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function LogSleep() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const uid = await getUid();
    if (!uid) return setMsg("Not signed in.");

    const start_time = localToISO(start);
    const end_time = localToISO(end);
    const date = localToDate(start);
    if (!start_time || !end_time || !date) return setMsg("Please provide valid Start and End times.");
    if (new Date(end_time) <= new Date(start_time)) return setMsg("End time must be after start time.");

    const hours = (new Date(end_time) - new Date(start_time)) / 36e5;
    const total_sleep_hours = +hours.toFixed(2);

    setSaving(true);
    const { error } = await supabase.from("sleep_data").insert({
      user_id: uid,
      date,
      start_time,
      end_time,
      total_sleep_hours,
      created_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) return setMsg(`Save failed: ${error.message}`);
    setStart(""); setEnd("");
    setMsg("Saved ✓");
  }

  return (
    <main className="center-wrap">
      <form className="card" onSubmit={submit}>
        <img src="/logo.png" alt="Sentinel Health" className="logo" />
        <h1 className="h1">Log Sleep</h1>

        <label className="label">Start</label>
        <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required />

        <label className="label">End</label>
        <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} required />

        <div className="row">
          <button className="btn" type="button" onClick={()=>{ setStart(""); setEnd(""); }}>Clear</button>
          <button className="btn primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        </div>

        <div className="label" style={{ color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
