// src/pages/LogMigraine.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Migraines } from "@/data/supabaseStore";

// Adjust/extend these as you like
const SYMPTOMS = [
  "nausea", "vomiting", "light_sensitivity", "sound_sensitivity",
  "visual_aura", "dizziness", "fatigue"
];
const TRIGGERS = [
  "stress", "lack_of_sleep", "weather_change", "hormonal", "food",
  "dehydration", "screen_time"
];

export default function LogMigraine() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: "",           // datetime-local
    pain: "",           // 1–10
    glucose_at_start: "",
    note: "",
  });
  const [symptoms, setSymptoms] = useState([]);
  const [triggers, setTriggers] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(list, setList, item) {
    setList((prev) => prev.includes(item) ? prev.filter(i => i !== item) : prev.concat(item));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.date) return setError("Please choose the migraine date/time.");
    const painNum = Number(form.pain);
    if (!isFinite(painNum) || painNum < 1 || painNum > 10) {
      return setError("Pain level must be between 1 and 10.");
    }
    const glucoseNum =
      form.glucose_at_start !== "" ? Number(form.glucose_at_start) : null;
    if (glucoseNum !== null && (!isFinite(glucoseNum) || glucoseNum < 10 || glucoseNum > 800)) {
      return setError("Glucose must be between 10 and 800 mg/dL (or leave blank).");
    }

    try {
      setSaving(true);
      await Migraines.create({
        date: form.date,
        pain: painNum,
        symptoms,
        triggers,
        glucose_at_start: glucoseNum,
        note: form.note || "",
      });
      navigate("/"); // back to Dashboard
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save migraine entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Log Migraine</h1>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3">
            {error}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium">Date & time</span>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Pain level (1–10)</span>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full border rounded p-2"
            value={form.pain}
            onChange={(e) => setForm({ ...form, pain: e.target.value })}
            required
          />
        </label>

        <fieldset className="border rounded p-3">
          <legend className="text-sm font-medium px-1">Symptoms</legend>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => (
              <label key={s} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={symptoms.includes(s)}
                  onChange={() => toggle(symptoms, setSymptoms, s)}
                />
                <span className="text-sm capitalize">{s.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded p-3">
          <legend className="text-sm font-medium px-1">Possible triggers</legend>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGERS.map((t) => (
              <label key={t} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={triggers.includes(t)}
                  onChange={() => toggle(triggers, setTriggers, t)}
                />
                <span className="text-sm capitalize">{t.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">Glucose at start (mg/dL) — optional</span>
          <input
            type="number"
            min="10"
            max="800"
            className="w-full border rounded p-2"
            value={form.glucose_at_start}
            onChange={(e) => setForm({ ...form, glucose_at_start: e.target.value })}
            placeholder="e.g., 110"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            className="w-full border rounded p-2"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Anything else you'd like to remember…"
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