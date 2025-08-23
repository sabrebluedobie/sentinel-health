// src/pages/LogMigraine.jsx
import React, { useMemo, useState, useEffect } from 'react';
import './log-migraine.css'; // <-- add this file (see below)

const DEFAULT_SYMPTOMS = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'aura', label: 'Aura' },
  { id: 'photophobia', label: 'Light Sensitivity' },
  { id: 'phonophobia', label: 'Sound Sensitivity' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'neck', label: 'Neck Pain' },
];

export default function LogMigraine({
  initialPain = 0,
  initialSymptoms = [],
  initialNotes = '',
  symptomOptions = DEFAULT_SYMPTOMS,
  onSave,
}) {
  const [pain, setPain] = useState(initialPain);
  const [selected, setSelected] = useState(initialSymptoms);
  const [notes, setNotes] = useState(initialNotes);

  useMemo(() => new Map(symptomOptions.map((s) => [s.id, s.label])), [symptomOptions]);

  const toggleSymptom = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave && onSave({ pain: Number(pain), symptoms: selected, notes });
  };

  // keyboard focus outline helper (uses your --focus color var if set)
  useEffect(() => {
    const id = 'lm-focus-style';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
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

  const onTagKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSymptom(id);
    }
  };

  return (
    <div className="page container">
      <form className="card card--elevated" onSubmit={handleSave} aria-labelledby="log-migraine-title">
        <h2 id="log-migraine-title" className="h2">Log Migraine</h2>

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
          onChange={(e) => setPain(e.target.value)}
          aria-label="Pain level slider"
        />

        {/* Symptoms */}
        <div className="label">Symptoms</div>
        <div className="tags" role="group" aria-label="Symptoms">
          {symptomOptions.map((item) => {
            const isActive = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag lm-focusable ${isActive ? 'tag--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => toggleSymptom(item.id)}
                onKeyDown={(e) => onTagKeyDown(e, item.id)}
              >
                <span className={`tag__text ${isActive ? 'tag__text--active' : ''}`}>
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
          <button type="submit" className="btn btn--primary lm-focusable">
            <span className="btn__text">Save Entry</span>
          </button>
        </div>
      </form>
    </div>
  );
}