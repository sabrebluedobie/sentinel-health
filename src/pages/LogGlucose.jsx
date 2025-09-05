import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function LogGlucose() {
  const [form, setForm] = useState({ device_time: "", value_mgdl: "" });
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.from("glucose_readings").insert([{
      device_time: form.device_time ? new Date(form.device_time).toISOString() : null,
      value_mgdl: form.value_mgdl !== "" ? Number(form.value_mgdl) : null,
    }]);
    setMsg(error ? error.message : "Saved ✓");
  }

  return (
    <div className="app-shell container-page">
      <div className="card max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Log Glucose</h1>
        <form onSubmit={save} className="space-y-3">
          <label className="label">Time</label>
          <input type="datetime-local" className="input" value={form.device_time}
            onChange={e=>setForm(v=>({...v, device_time: e.target.value}))} />
          <label className="label">Value (mg/dL)</label>
          <input type="number" min="20" max="600" className="input" value={form.value_mgdl}
            onChange={e=>setForm(v=>({...v, value_mgdl: e.target.value}))} />
          {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          <button className="btn-primary" type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}