// src/components/modals/MigraineLogModal.jsx
import React, { useMemo, useState } from "react";
import Modal from "../common/Modal.jsx";
import "../forms/form.css";

const SYMPTOMS = ["Nausea","Vomiting","Photophobia","Phonophobia","Aura","Dizziness","Neck pain","Numbness/tingling","Blurred vision","Fatigue","Osmophobia","Allodynia"];
const TRIGGERS = ["Stress","Lack of sleep","Dehydration","Skipped meal","Bright lights","Strong smells","Hormonal","Weather","Heat","Screen time","Alcohol","Chocolate","Caffeine change"];

export default function MigraineLogModal({ open, onClose, onSave, initial }) {
  const [start, setStart]       = useState(() => initial?.start_time || new Date().toISOString().slice(0,16));
  const [end, setEnd]           = useState(() => initial?.end_time   || "");
  const [severity, setSeverity] = useState(() => initial?.severity   ?? 5);
  const [location, setLocation] = useState(() => initial?.location   || "");
  const [symptoms, setSymptoms] = useState(() => Array.isArray(initial?.symptoms) ? initial.symptoms : []);
  const [symAdd, setSymAdd]     = useState("");
  const [triggers, setTriggers] = useState(() => Array.isArray(initial?.triggers) ? initial.triggers : []);
  const [trigAdd, setTrigAdd]   = useState("");
  const [medication, setMedication] = useState(() => initial?.medication || "");
  const [effective, setEffective]   = useState(() => Boolean(initial?.effective) || false);
  const [notes, setNotes]           = useState(() => initial?.notes || "");

  if (!open) return null;

  const selected = useMemo(() => new Set(symptoms), [symptoms]);
  const selectedT = useMemo(() => new Set(triggers), [triggers]);

  const toggle = (set, list, v) => {
    const s = new Set(list);
    s.has(v) ? s.delete(v) : s.add(v);
    set(Array.from(s));
  };

  function addCommaSeparated(raw, list, setter, clear) {
    const parts = String(raw).split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length) setter(Array.from(new Set([...list, ...parts])));
    clear("");
  }

  async function handleSave() {
    const payload = {
      start_time: start ? new Date(start).toISOString() : null,
      end_time:   end   ? new Date(end).toISOString()   : null,
      severity:   Number(severity) || null,
      location:   location || null,
      symptoms,
      triggers,
      medication: medication || null,
      effective,
      notes:      notes || null
    };
    await onSave?.(payload);
    onClose?.();
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Log Migraine</h3>

      <label className="label">Start time
        <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
      </label>

      <label className="label">End time (optional)
        <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
      </label>

      <label className="label">Severity (1–10)
        <input className="input" type="number" min="1" max="10" value={severity} onChange={e=>setSeverity(e.target.value)} />
      </label>

      <label className="label">Location (head/neck/etc)
        <input className="input" value={location} onChange={e=>setLocation(e.target.value)} />
      </label>

      <div className="label">Symptoms</div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {SYMPTOMS.map(s => (
          <button key={s} type="button" className="btn" onClick={()=>toggle(setSymptoms, symptoms, s)}
            style={{ background: selected.has(s) ? "var(--brand)" : "#fff", color: selected.has(s) ? "#fff" : "inherit" }}>
            {s}
          </button>
        ))}
      </div>
      <div className="row">
        <input className="input" placeholder="add comma-separated symptoms" value={symAdd} onChange={e=>setSymAdd(e.target.value)} />
        <button className="btn" onClick={()=>addCommaSeparated(symAdd, symptoms, setSymptoms, setSymAdd)}>Add</button>
      </div>

      <div className="label">Triggers</div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {TRIGGERS.map(t => (
          <button key={t} type="button" className="btn" onClick={()=>toggle(setTriggers, triggers, t)}
            style={{ background: selectedT.has(t) ? "var(--brand)" : "#fff", color: selectedT.has(t) ? "#fff" : "inherit" }}>
            {t}
          </button>
        ))}
      </div>
      <div className="row">
        <input className="input" placeholder="add comma-separated triggers" value={trigAdd} onChange={e=>setTrigAdd(e.target.value)} />
        <button className="btn" onClick={()=>addCommaSeparated(trigAdd, triggers, setTriggers, setTrigAdd)}>Add</button>
      </div>

      <label className="label">Medication
        <input className="input" value={medication} onChange={e=>setMedication(e.target.value)} />
      </label>

      <label className="label">
        <input type="checkbox" checked={effective} onChange={e=>setEffective(e.target.checked)} style={{ marginRight: 8 }} />
        Medication was effective
      </label>

      <label className="label">Notes
        <textarea className="input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
      </label>

      <div className="row">
        <button className="btn primary" onClick={handleSave}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
