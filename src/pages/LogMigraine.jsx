
import React, { useState } from "react";
import supabase from "@/lib/supabase";
import EducationModal from "@/components/modals/EducationModal.jsx";

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
  const [showEducation, setShowEducation] = useState(false);

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

        {/* Education helper - contextual during logging */}
        <div style={{ 
          background: "#f0f9ff", 
          border: "1px solid #e0f2fe", 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ fontSize: 14, color: "#0f172a" }}>
            <strong>Not sure about symptoms or migraine type?</strong>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Learn about different migraine patterns and when to seek urgent care
            </div>
          </div>
          <button 
            type="button"
            className="btn"
            onClick={() => setShowEducation(true)}
            style={{ 
              background: "#2563eb", 
              color: "#fff", 
              fontSize: 12, 
              padding: "6px 12px",
              whiteSpace: "nowrap"
            }}
          >
            📚 Guide
          </button>
        </div>

        <label className="label">Start</label>
        <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required />

        <label className="label">End (optional)</label>
        <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />

        <label className="label">Severity (1–10)</label>
        <input className="input" type="number" min="1" max="10" value={severity} onChange={e=>setSeverity(e.target.value)} />

        <label className="label">
          Triggers (comma-separated)
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: "normal", marginLeft: 6 }}>
            e.g., stress, bright lights, hormonal changes
          </span>
        </label>
        <input className="input" type="text" value={triggers} onChange={e=>setTriggers(e.target.value)} placeholder="stress, dehydration, lack of sleep" />

        <label className="label">
          Symptoms (comma-separated)
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: "normal", marginLeft: 6 }}>
            e.g., aura, nausea, sensitivity to light
          </span>
        </label>
        <input className="input" type="text" value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="aura, nausea, photophobia, one-sided pain" />

        <label className="label">Medications (comma-separated)</label>
        <input className="input" type="text" value={meds} onChange={e=>setMeds(e.target.value)} placeholder="sumatriptan, ibuprofen, caffeine" />

        <label className="label">Notes (optional)</label>
        <textarea className="input" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Additional details about this episode..." />

        <div className="row">
          <button className="btn" type="button" onClick={() => { setStart(""); setEnd(""); setSeverity(5); setTriggers(""); setSymptoms(""); setMeds(""); setNotes(""); }}>Clear</button>
          <button className="btn primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save Episode"}</button>
        </div>

        <div className="label" style={{ color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>

      {/* Education Modal */}
      {showEducation && (
        <EducationModal onClose={() => setShowEducation(false)} />
      )}
    </main>
  );
}
