// src/components/modals/GlucoseModal.jsx
import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import "../forms/form.css";

export default function GlucoseModal({ open, onClose, onSave, initial }) {
  const [value, setValue]       = useState(() => initial?.value_mgdl ?? "");
  const [when, setWhen]         = useState(() => initial?.time || new Date().toISOString().slice(0,16));
  const [readingType, setType]  = useState(() => initial?.reading_type || "random");
  const [trend, setTrend]       = useState(() => initial?.trend || "");
  const [source, setSource]     = useState(() => initial?.source || "");
  const [note, setNote]         = useState(() => initial?.note || "");

  if (!open) return null;

  async function handleSave() {
    const payload = {
      value_mgdl: value==="" ? null : Number(value),
      time: new Date(when).toISOString(),
      reading_type: readingType || null,
      trend: trend || null,
      source: source || null,
      note: note || null
    };
    await onSave?.(payload);
    onClose?.();
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Log Glucose</h3>

      <label className="label">Value (mg/dL)
        <input className="input" type="number" inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} />
      </label>

      <label className="label">Time
        <input className="input" type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
      </label>

      <label className="label">Reading type
        <select className="input" value={readingType} onChange={e=>setType(e.target.value)}>
          <option value="random">Random</option>
          <option value="fasting">Fasting</option>
          <option value="post_meal">Post meal</option>
          <option value="bedtime">Bedtime</option>
        </select>
      </label>

      <label className="label">Trend
        <input className="input" value={trend} onChange={e=>setTrend(e.target.value)} placeholder="rising / falling / steady" />
      </label>

      <label className="label">Source
        <input className="input" value={source} onChange={e=>setSource(e.target.value)} placeholder="Dexcom, Libre, Manual…" />
      </label>

      <label className="label">Note
        <textarea className="input" rows={2} value={note} onChange={e=>setNote(e.target.value)} />
      </label>

      <div className="row">
        <button className="btn primary" onClick={handleSave}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
