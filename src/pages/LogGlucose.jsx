import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useNightscout } from "../hooks/useNightscout";

// Accepts value from <input type="datetime-local"> and returns ISO (tz-aware).
function localDatetimeToISO(local) {
  // Example input: "2025-09-05T17:28"
  if (!local) return null;
  const [d, t] = local.split("T");
  if (!d || !t) return null;
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  // Interpret as local time, then convert to real ISO
  const dt = new Date(y, m - 1, day, hh ?? 0, mm ?? 0, 0, 0);
  return dt.toISOString();
}

export default function LogGlucose() {
  const navigate = useNavigate();
  const { saveGlucose } = useNightscout();
  
  const [when, setWhen] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mg/dL");
  const [readingType, setReadingType] = useState("sgv"); // sgv = CGM, mbg = finger stick
  const [notes, setNotes] = useState("");
  const [syncToNightscout, setSyncToNightscout] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function insertHealthReading(payload) {
    // Try with user_id first; if the column doesn't exist, retry without it.
    let { error } = await supabase.from("health_readings").insert([payload]);
    if (error && /user_id/i.test(error.message)) {
      const { user_id, ...rest } = payload;
      ({ error } = await supabase.from("health_readings").insert([rest]));
    }
    return { error };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const iso = when ? new Date(when).toISOString() : new Date().toISOString();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You must be signed in to save.");
      return;
    }

    const payload = {
      user_id: user.id,
      created_at: iso,
      value: value === "" ? null : Number(value),
      unit: unit || "mg/dL",
      source: "manual",
      type: "glucose",
      raw: notes ? { notes } : null
    };

    // Save to Supabase first
    const { error: upErr } = await insertHealthReading(payload);
    
    if (upErr) {
      setBusy(false);
      setError(upErr.message);
      return;
    }

    // If Nightscout sync is enabled, sync there too
    if (syncToNightscout) {
      try {
        const glucoseValue = Number(value);
        
        // Convert mmol/L to mg/dL if needed (Nightscout prefers mg/dL)
        const valueMgdl = unit === "mmol/L" 
          ? Math.round(glucoseValue * 18) 
          : glucoseValue;

        await saveGlucose({
          value_mgdl: valueMgdl,
          time: iso,
          reading_type: readingType,
          note: notes || undefined
        });
        
        // Don't fail the whole operation if Nightscout sync fails
        // The user still has their data in Sentrya
      } catch (nsError) {
        console.warn("Nightscout sync failed:", nsError);
        // Optionally show a warning but don't block navigation
      }
    }

    setBusy(false);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
            ← Back
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-semibold text-zinc-900">Log Glucose</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Save a manual glucose reading.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">Date & time</label>
              <input
                type="datetime-local"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">Value</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">Unit</label>
                <select
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">Reading Type</label>
              <select
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                value={readingType}
                onChange={(e) => setReadingType(e.target.value)}
              >
                <option value="sgv">CGM Reading</option>
                <option value="mbg">Finger Stick</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">Notes (optional)</label>
              <textarea
                rows={3}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Before lunch, felt dizzy, etc."
              />
            </div>

            {/* Nightscout Sync Toggle */}
            <div className="bg-blue-50 p-4 rounded-md">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToNightscout}
                  onChange={(e) => setSyncToNightscout(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Also sync to Nightscout
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-7">
                {syncToNightscout 
                  ? "This reading will be saved to both Sentrya and Nightscout" 
                  : "This reading will only be saved to Sentrya"}
              </p>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <Link to="/" className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
