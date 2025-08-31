import React, { useState } from "react";
import supabase from "@/lib/supabase";

function csvToArray(v) { return v ? v.split(",").map(s=>s.trim()).filter(Boolean) : []; }
function localToISO(local) {
  if (!local) return null;
  const d = new Date(local.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function LogMigraine() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [severity, setSeverity] = useState(5);
  const [triggers, setTriggers] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [meds, setMeds] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const uid = await getUid();
    if (!uid) return setMsg("Not signed in.");
    const start_time = localToISO(start);
    const end_time = localToISO(end);
    if (!start_time) return setMsg("Please provide a valid start time.");
    if (end_time && new Date(end_time) <= new Date(start_time)) return setMsg("End time must be after start time.");

    const sev = Number(severity);
    if (!Number.isFinite(sev) || sev < 1 || sev > 10) return setMsg("Severity must be 1–10.");

    const row = {
      user_id: uid,
      start_time,
      end_time: end_time || null,
      severity: sev,
      triggers: csvToArray(triggers),
      symptoms: csvToArray(symptoms),
      medications: csvToArray(meds),
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    setSaving(true);
    const { error } = await supabase.from("migraine_episodes").insert(row);
    setSaving(false);
    if (error) return setMsg(`Save failed: ${error.message}`);

    setStart(""); setEnd(""); setSeverity(5); setTriggers(""); setSymptoms(""); setMeds(""); setNotes("");
    setMsg("Saved ✓");
  }

  return (
    <main className="center-wrap">
      <form className="card" onSubmit={submit}>
        <img src="/logo.png" alt="Sentinel Health" className="logo" />
        <h1 className="h1">Log Migraine Episode</h1>

        <label className="label">Start</label>
        <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required />

        <label className="label">End (optional)</label>
        <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />

        <label className="label">Severity (1–10)</label>
        <input className="input" type="number" min="1" max="10" value={severity} onChange={e=>setSeverity(e.target.value)} />

        <label className="label">Triggers (comma-separated)</label>
        <input className="input" type="text" value={triggers} onChange={e=>setTriggers(e.target.value)} placeholder="stress, dehydration" />

        <label className="label">Symptoms (comma-separated)</label>
        <input className="input" type="text" value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="aura, nausea, photophobia" />

        <label className="label">Medications (comma-separated)</label>
        <input className="input" type="text" value={meds} onChange={e=>setMeds(e.target.value)} placeholder="sumatriptan, caffeine" />

        <label className="label">Notes (optional)</label>
        <textarea className="input" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} />

        <div className="row">
          <button className="btn" type="button" onClick={() => { setStart(""); setEnd(""); setSeverity(5); setTriggers(""); setSymptoms(""); setMeds(""); setNotes(""); }}>Clear</button>
          <button className="btn primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save Episode"}</button>
        </div>

        <div className="label" style={{ color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
