import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "@/lib/supabase";
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
async function handleSave(e) {
  e.preventDefault();
  try {
    const { user } = await supabase.auth.getUser().then(r => r.data);
    if (!user) throw new Error("AUTH_REQUIRED");

    const iso = localDatetimeToISO(dateTime); // dateTime = state bound to the datetime-local input

    const payload = {
      user_id: user.id,
      start_time: iso,                       // <-- REQUIRED
      created_at: iso,                       // optional but fine to keep
      value: value === "" ? null : Number(value),
      unit: unit || "mg/dL",
      source: "manual",
      type: "glucose",
      raw: notes ? { notes } : null,
    };

    const { error } = await supabase.from("health_readings").insert(payload);
    if (error) throw error;

    // success → navigate back
    navigate("/glucose");
  } catch (err) {
    setError(err.message ?? String(err));
  }
}
export default function LogGlucose() {
  const navigate = useNavigate();
  const [when, setWhen] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mg/dL");
  const [notes, setNotes] = useState("");

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
  type: "glucose",              // <— add this
  raw: notes ? { notes } : null
};

    const { error: upErr } = await insertHealthReading(payload);
    setBusy(false);

    if (upErr) {
      setError(upErr.message);
      return;
    }
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
                <input
                  type="text"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
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