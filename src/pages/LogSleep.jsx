// src/pages/LogSleep.jsx
import React, { useState } from "react";
import supabase from "@/lib/supabase";

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function LogSleep() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  function computeHours(s, e) {
    if (!s || !e) return "";
    const d1 = new Date(s), d2 = new Date(e);
    const h = (d2 - d1) / 36e5;
    return Number.isFinite(h) && h > 0 ? (Math.round(h * 100) / 100).toString() : "";
    }

  return (
    <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 className="h1" style={{ textAlign: "left" }}>Log Sleep</h1>

      <label className="label">Start time</label>
      <input
        className="input"
        type="datetime-local"
        value={start}
        onChange={(e) => { setStart(e.target.value); if (end) setHours(computeHours(e.target.value, end)); }}
        required
      />

      <label className="label">End time</label>
      <input
        className="input"
        type="datetime-local"
        value={end}
        onChange={(e) => { setEnd(e.target.value); if (start) setHours(computeHours(start, e.target.value)); }}
      />

      <label className="label">Total sleep (hours)</label>
      <input
        className="input"
        type="number"
        step="0.25"
        min="0"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="If blank, computed from start/end"
      />

      <label className="label">Notes (optional)</label>
      <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

      {msg && <div className="label" style={{ color: msg.startsWith("Error") ? "crimson" : "#047857" }}>{msg}</div>}

      <div className="row">
        <button
          className="btn primary"
          onClick={async () => {
            setMsg("");
            const uid = await getUid();
            if (!uid) return setMsg("Error: not signed in.");

            // Build row for Supabase
            const row = {
              user_id: uid,
              start_time: start ? new Date(start).toISOString() : null,
              end_time: end ? new Date(end).toISOString() : null,
              total_sleep_hours: hours ? Number(hours) : null,
              notes: notes || null,
            };

            // Require at least start + (end or hours)
            if (!row.start_time || (!row.end_time && row.total_sleep_hours == null)) {
              return setMsg("Error: provide start and either end or total hours.");
            }

            const { error } = await supabase.from("sleep_data").insert([row]);
            if (error) return setMsg("Error: " + (error.message || String(error)));

            // Optional: mirror as Nightscout Note (harmless if your bridge isn’t set up)
            try {
              await fetch("/api/nightscout/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  kind: "note",
                  start_time: row.start_time,
                  notes: `Sleep: ${row.total_sleep_hours ?? computeHours(start, end) ?? "?"}h${notes ? "\n" + notes : ""}`,
                }),
              });
            } catch {}

            setMsg("Saved ✔");
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
