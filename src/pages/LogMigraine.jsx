import React, { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function LogMigraine() {
  const [started_at, setStart] = useState("");
  const [pain, setPain] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setMsg({}); setBusy(true);

    if (!started_at) {
      setBusy(false);
      setMsg({ kind: "error", text: "Start time is required." });
      return;
    }

    const payload = {
      started_at: new Date(started_at).toISOString(),
      pain: pain === "" ? null : Number(pain),
      symptoms: symptoms || null,
      notes: notes || null,
    };

    const { error } = await supabase.from("migraine_episodes").insert([payload]);
    setBusy(false);
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Saved ✓" });
    if (!error) { setPain(""); setSymptoms(""); setNotes(""); }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Log Migraine</h1>
          <Link to="/" className="btn-ghost no-underline text-sm">← Back</Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Start time</label>
            <input
              type="datetime-local"
              className="input"
              value={started_at}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Pain (0–10)</label>
            <input
              type="number"
              min="0"
              max="10"
              className="input"
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="label">Symptoms</label>
            <input
              className="input"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., nausea, aura"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else to remember?"
            />
          </div>

          {!!msg.text && (
            <div className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
              {msg.text}
            </div>
          )}

          <div className="flex gap-2">
            <button disabled={busy} className="btn-primary" type="submit">
              {busy ? "Saving…" : "Save"}
            </button>
            <Link to="/" className="btn-ghost no-underline">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}