import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function LogSleep() {
  const [form, setForm] = useState({ start_time: "", end_time: "", efficiency: "" });
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.from("sleep_data").insert([{
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      efficiency: form.efficiency !== "" ? Number(form.efficiency) : null,
    }]);
    setMsg(error ? error.message : "Saved ✓");
  }

  return (
    <div className="app-shell container-page">
      <div className="card max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Log Sleep</h1>
        <form onSubmit={save} className="space-y-3">
          <label className="label">Start</label>
          <input type="datetime-local" className="input" value={form.start_time}
            onChange={e=>setForm(v=>({...v, start_time: e.target.value}))} />
          <label className="label">End</label>
          <input type="datetime-local" className="input" value={form.end_time}
            onChange={e=>setForm(v=>({...v, end_time: e.target.value}))} />
          <label className="label">Efficiency (%)</label>
          <input type="number" min="0" max="100" className="input" value={form.efficiency}
            onChange={e=>setForm(v=>({...v, efficiency: e.target.value}))} />
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <button className="btn-primary" type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}