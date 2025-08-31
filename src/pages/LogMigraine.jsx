import React, { useState } from "react";
import supabase from "@/lib/supabase";

function csvToArray(v) {
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
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

  async function getUserId() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  }

  function toISO(local) {
    if (!local) return null;
    const d = new Date(local.replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const uid = await getUserId();
    if (!uid) return setMsg("Not signed in.");

    const started_at = toISO(start);
    const ended_at = toISO(end);

    if (!started_at) return setMsg("Please provide a valid start time.");
    if (ended_at && new Date(ended_at) <= new Date(started_at)) {
      return setMsg("End time must be after start time.");
    }
    const sev = Number(severity);
    if (!Number.isFinite(sev) || sev < 1 || sev > 10) return setMsg("Severity must be 1–10.");

    const row = {
      user_id: uid,
      started_at,
      ended_at: ended_at || null,
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
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Log Migraine Episode</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Start
          <input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required />
        </label>
        <label>
          End (optional)
          <input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
        </label>
        <label>
          Severity (1–10)
          <input type="number" min="1" max="10" value={severity} onChange={e=>setSeverity(e.target.value)} />
        </label>
        <label>
          Triggers (comma-separated)
          <input type="text" value={triggers} onChange={e=>setTriggers(e.target.value)} placeholder="stress, lack of sleep" />
        </label>
        <label>
          Symptoms (comma-separated)
          <input type="text" value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="aura, nausea, photophobia" />
        </label>
        <label>
          Medications (comma-separated)
          <input type="text" value={meds} onChange={e=>setMeds(e.target.value)} placeholder="sumatriptan, caffeine" />
        </label>
        <label>
          Notes (optional)
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} />
        </label>
        <button disabled={saving} type="submit">{saving ? "Saving…" : "Save Episode"}</button>
        <div style={{ minHeight: 20, color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
