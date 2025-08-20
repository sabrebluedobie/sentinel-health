// src/pages/LogGlucose.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Glucose } from "@/data/supabaseStore";

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
    <div className="container mx-auto px-4 sm:px-6 py-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Log Glucose</h1>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3">{error}</div>}

        <label className="block">
          <span className="text-sm font-medium">Reading time</span>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.device_time}
            onChange={(e) => setForm({ ...form, device_time: e.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Value (mg/dL)</span>
          <input
            type="number"
            min="10"
            max="800"
            className="w-full border rounded p-2"
            value={form.value_mgdl}
            onChange={(e) => setForm({ ...form, value_mgdl: e.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Trend (optional)</span>
          <input
            type="text"
            placeholder="↗, ↘, flat, or device code"
            className="w-full border rounded p-2"
            value={form.trend}
            onChange={(e) => setForm({ ...form, trend: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Source</span>
          <select
            className="w-full border rounded p-2"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            className="w-full border rounded p-2"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button disabled={saving} className="bg-blue-600 text-white rounded px-4 py-2">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => navigate("/")} className="border rounded px-4 py-2">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}