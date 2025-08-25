// src/pages/LogSleep.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SleepData } from "@/entities/client";
import "@/components/forms/form.css";

export default function LogSleep() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    start_time: "",
    end_time: "",
    efficiency: "",
    stages: { light: "", deep: "", rem: "", awake: "" },
    note: "",
    source: "manual",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        efficiency: form.efficiency ? Number(form.efficiency) : null,
        stages: {
          light: Number(form.stages.light || 0),
          deep: Number(form.stages.deep || 0),
          rem: Number(form.stages.rem || 0),
          awake: Number(form.stages.awake || 0),
        },
        date: form.start_time || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      await SleepData.create(payload);
      nav("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save sleep entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <form
        onSubmit={onSubmit}
        className="form-card"
        style={{ "--form-accent": "var(--sleep-border, #60A5FA)" }}
        aria-labelledby="log-sleep-title"
      >
        <h1 id="log-sleep-title" className="form-title">Log Sleep</h1>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="form-field">
          <label className="form-label" htmlFor="sleep-start">Start time</label>
          <input
            id="sleep-start"
            type="datetime-local"
            className="form-input"
            value={form.start_time}
            onChange={(e)=>setForm(f=>({...f, start_time: e.target.value}))}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sleep-end">End time</label>
          <input
            id="sleep-end"
            type="datetime-local"
            className="form-input"
            value={form.end_time}
            onChange={(e)=>setForm(f=>({...f, end_time: e.target.value}))}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="sleep-eff">Efficiency (0–100)</label>
          <input
            id="sleep-eff"
            type="number" min="0" max="100"
            className="form-input"
            value={form.efficiency}
            onChange={(e)=>setForm(f=>({...f, efficiency: e.target.value}))}
          />
          <div className="form-hint">Optional; leave blank if unknown</div>
        </div>

        <fieldset className="form-field" style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, padding: 12 }}>
          <legend className="form-label" style={{ padding: "0 6px" }}>Stages (minutes)</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["light","deep","rem","awake"].map(k=>(
              <label key={k} className="form-field" style={{ margin: 0 }}>
                <span className="form-label" style={{ textTransform: "uppercase", fontSize: 12 }}>{k}</span>
                <input
                  type="number" min="0" className="form-input"
                  value={form.stages[k]}
                  onChange={(e)=>setForm(f=>({...f, stages:{...f.stages, [k]: e.target.value}}))}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-field">
          <label className="form-label" htmlFor="sleep-notes">Notes</label>
          <textarea
            id="sleep-notes"
            className="form-textarea"
            rows={3}
            value={form.note}
            onChange={(e)=>setForm(f=>({...f, note: e.target.value}))}
          />
        </div>

        <div className="form-actions">
          <button disabled={saving} className="button-primary" type="submit">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={()=>nav("/")} className="button-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}