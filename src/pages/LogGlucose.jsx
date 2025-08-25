// src/pages/LogGlucose.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Glucose } from "@/data/supabaseStore";
import "@/components/forms/form.css";

const SOURCES = ["manual","nightscout","libre","dexcom","apple_health","google_fit"];

export default function LogGlucose() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    device_time: "",
    value_mgdl: "",
    trend: "",
    source: "manual",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.device_time || !form.value_mgdl) {
      setError("Please provide time and value.");
      return;
    }
    const val = Number(form.value_mgdl);
    if (!isFinite(val) || val < 10 || val > 800) {
      setError("Value must be between 10 and 800 mg/dL.");
      return;
    }

    try {
      setSaving(true);
      await Glucose.create({
        device_time: form.device_time,
        value_mgdl: val,
        trend: form.trend || null,
        source: form.source,
        note: form.note || null,
      });
      navigate("/"); // back to Dashboard
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save glucose reading.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <form
        onSubmit={onSubmit}
        className="form-card"
        style={{ "--form-accent": "var(--bg-border, #34D399)" }}
        aria-labelledby="log-glucose-title"
      >
        <h1 id="log-glucose-title" className="form-title">Log Blood Glucose</h1>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="form-field">
          <label className="form-label" htmlFor="glucose-time">Reading time</label>
          <input
            id="glucose-time"
            type="datetime-local"
            className="form-input"
            value={form.device_time}
            onChange={(e) => setForm({ ...form, device_time: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="glucose-value">Value (mg/dL)</label>
          <input
            id="glucose-value"
            type="number"
            min="10"
            max="800"
            className="form-input"
            value={form.value_mgdl}
            onChange={(e) => setForm({ ...form, value_mgdl: e.target.value })}
            required
          />
          <div className="form-hint">Typical range 70–180 mg/dL (context dependent)</div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="glucose-trend">Trend (optional)</label>
          <input
            id="glucose-trend"
            type="text"
            placeholder="↗, ↘, flat, or device code"
            className="form-input"
            value={form.trend}
            onChange={(e) => setForm({ ...form, trend: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="glucose-source">Source</label>
          <select
            id="glucose-source"
            className="form-select"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="glucose-notes">Notes (optional)</label>
          <textarea
            id="glucose-notes"
            className="form-textarea"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button disabled={saving} className="button-primary" type="submit">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => navigate("/")} className="button-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}