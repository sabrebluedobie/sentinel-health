// src/pages/LogMigraine.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Migraine } from '@/data/supabaseStore';
import '@/components/forms/form.css';


const DEFAULT_SYMPTOMS = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'aura', label: 'Aura' },
  { id: 'photophobia', label: 'Light Sensitivity' },
  { id: 'phonophobia', label: 'Sound Sensitivity' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'neck', label: 'Neck Pain' },
];

export default function LogMigraine() { 
  const navigate = useNavigate();
  const [pain, setPain] = useState(0);
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useMemo(() => new Map(DEFAULT_SYMPTOMS.map((s) => [s.id, s.label])), []);

  useEffect(() => {
    const id = "lm-focus-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        .lm-focusable:focus {
          outline: 3px solid var(--focus, #93C5FD);
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const toggleSymptom = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      setSaving(true);
      await Migraine.create({ pain, symptoms: selected, notes });
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Could not save migraine entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page container">
      <form className="card card--elevated" onSubmit={onSubmit} aria-labelledby="log-migraine-title">
        <h2 id="log-migraine-title" className="h2">Log Migraine</h2>

        {msg && (
          <div className="form-error" role="alert" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        {/* Pain Level */}
        <label htmlFor="pain-range" className="label">Pain Level</label>
        <div className="row row--center gap-sm">
          <div aria-live="polite" aria-atomic="true" className="scale-text">{pain}</div>
          <div className="muted small">0 (none) – 10 (worst)</div>
        </div>
        <input
          id="pain-range"
          className="lm-focusable range"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => setPain(Number(e.target.value))}
          aria-label="Pain level slider"
        />

        {/* Symptoms */}
        <div className="label">Symptoms</div>
        <div className="tags" role="group" aria-label="Symptoms">
          {DEFAULT_SYMPTOMS.map((item) => {
            const isActive = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag lm-focusable ${isActive ? "tag--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => toggleSymptom(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSymptom(item.id);
                  }
                }}
              >
                <span className={`tag__text ${isActive ? "tag__text--active" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <label htmlFor="notes" className="label">Notes</label>
        <textarea
          id="notes"
          className="textarea lm-focusable"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add details (duration, triggers, medication, etc.)"
        />

        {/* Actions */}
        <div className="actions">
          <button type="submit" disabled={saving} className="btn btn--primary lm-focusable">
            <span className="btn__text">{saving ? "Saving…" : "Save Entry"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
