import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function LogSleep() {
  const navigate = useNavigate();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function hoursBetween(a, b) {
    const sa = new Date(a).getTime();
    const sb = new Date(b).getTime();
    if (!Number.isFinite(sa) || !Number.isFinite(sb)) return null;
    return Math.max(0, (sb - sa) / (1000 * 60 * 60));
  }

  async function insertSleep(payload) {
    // Try with user_id; retry without if column missing
    let { error } = await supabase.from("sleep_data").insert([payload]);
    if (error && /user_id/i.test(error.message)) {
      const { user_id, ...rest } = payload;
      ({ error } = await supabase.from("sleep_data").insert([rest]));
    }
    return { error };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!start || !end) {
      setBusy(false);
      setError("Start and end times are required.");
      return;
    }

    const total = hoursBetween(start, end);
    if (total === null) {
      setBusy(false);
      setError("Invalid date(s).");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You must be signed in to save.");
      return;
    }

    const payload = {
      user_id: user.id,                         // retried away if not present
      started_at: new Date(start).toISOString(),
      ended_at: new Date(end).toISOString(),
      total_sleep_hours: Number(total.toFixed(2)), // NOT NULL column
      efficiency: efficiency === "" ? null : Number(efficiency),
      notes: notes || null,                      // keep if you added a notes column; else harmlessly ignored by retry logic if absent
    };

    let { error: insErr } = await insertSleep(payload);

    // If "column \"notes\" does not exist", retry without notes
    if (insErr && /notes/i.test(insErr.message)) {
      const { notes, ...rest } = payload;
      ({ error: insErr } = await insertSleep(rest));
    }

    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
            ← Back
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-semibold text-zinc-900">Log Sleep</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Enter last night’s sleep. Total hours are calculated automatically.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">Start</label>
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">End</label>
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">Total hours (auto)</label>
                <input
                  type="text"
                  value={
                    start && end && hoursBetween(start, end) !== null
                      ? hoursBetween(start, end).toFixed(2)
                      : ""
                  }
                  readOnly
                  className="block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">Efficiency % (optional)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={efficiency}
                  onChange={(e) => setEfficiency(e.target.value)}
                  placeholder="85"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">Notes (optional)</label>
              <textarea
                rows={3}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Woke up twice, took melatonin, etc."
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}