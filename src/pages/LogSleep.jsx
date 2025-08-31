// src/pages/LogSleep.jsx
import React, { useState } from "react";
import supabase from "@/lib/supabase";

function localToISO(local) {
  if (!local) return null;
  const d = new Date(local.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function localToDate(local) {
  return (local && local.split("T")[0]) || null;
}

export default function LogSleep() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function getUserId() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const uid = await getUserId();
    if (!uid) return setMsg("Not signed in.");

    const start_time = localToISO(start);
    const end_time = localToISO(end);
    const date = localToDate(start);

    if (!start_time || !date) return setMsg("Please provide a valid start time.");
    if (end_time && new Date(end_time) <= new Date(start_time)) {
      return setMsg("End time must be after start time.");
    }

    // compute hours if end given
    let total_sleep_hours = null;
    if (end_time) {
      const diffMs = new Date(end_time) - new Date(start_time);
      total_sleep_hours = +(diffMs / 36e5).toFixed(2); // 2 decimals
    }

    setSaving(true);
    const { error } = await supabase.from("sleep_data").insert({
      user_id: uid,
      start_time,
      end_time: end_time || null,
      date,
      total_sleep_hours, // NEW: required by your schema
      created_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) return setMsg(`Save failed: ${error.message}`);
    setStart(""); setEnd("");
    setMsg("Saved ✓");
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Log Sleep</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Start
          <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} required />
        </label>
        <label>
          End (optional)
          <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} />
        </label>
        <button disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        <div style={{ minHeight: 20, color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
