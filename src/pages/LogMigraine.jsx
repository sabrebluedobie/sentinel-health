import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function LogMigraine() {
  const [form, setForm] = useState({ started_at: "", pain: "", notes: "" });
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.from("migraine_episodes").insert([{
      started_at: form.started_at ? new Date(form.started_at).toISOString() : null,
      pain: form.pain !== "" ? Number(form.pain) : null,
      notes: form.notes || null,
    }]);
    setMsg(error ? error.message : "Saved ✓");
  }

  return (
    <div className="app-shell container-page">
      <div className="card max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Log Migraine</h1>
        <form onSubmit={save} className="space-y-3">
          <label className="label">Start time</label>
          <input type="datetime-local" className="input" value={form.started_at}
            onChange={e=>setForm(v=>({...v, started_at: e.target.value}))} />
          <label className="label">Pain (0–10)</label>
          <input type="number" min="0" max="10" className="input" value={form.pain}
            onChange={e=>setForm(v=>({...v, pain: e.target.value}))} />
          <label className="label">Notes</label>
          <textarea className="input" value={form.notes}
            onChange={e=>setForm(v=>({...v, notes: e.target.value}))} />
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <button className="btn-primary" type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}