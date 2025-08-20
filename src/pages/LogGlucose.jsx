// src/pages/LogGlucose.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlucoseReading } from "@/entities/client";

const SOURCES = ["manual","nightscout","libre","dexcom","apple_health","google_fit"];

export default function LogGlucose() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    device_time: "",
    value_mgdl: "",
    trend: "",
    source: "manual",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      device_time: new Date(form.device_time).toISOString(),
      value_mgdl: Number(form.value_mgdl),
      created_at: new Date().toISOString(),
      date: form.device_time || new Date().toISOString(), // for dashboard helpers
    };
    await GlucoseReading.create(payload);
    setSaving(false);
    nav("/");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log Glucose</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Reading time</span>
          <input type="datetime-local" className="w-full border rounded p-2"
            value={form.device_time}
            onChange={(e)=>setForm(f=>({...f, device_time: e.target.value}))}
            required/>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Value (mg/dL)</span>
          <input type="number" min="10" max="800" className="w-full border rounded p-2"
            value={form.value_mgdl}
            onChange={(e)=>setForm(f=>({...f, value_mgdl: e.target.value}))}
            required/>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Trend (optional)</span>
          <input type="text" placeholder="↗, ↘, flat, or device code" className="w-full border rounded p-2"
            value={form.trend}
            onChange={(e)=>setForm(f=>({...f, trend: e.target.value}))}/>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Source</span>
          <select className="w-full border rounded p-2"
            value={form.source}
            onChange={(e)=>setForm(f=>({...f, source: e.target.value}))}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Notes</span>
          <textarea className="w-full border rounded p-2"
            value={form.note}
            onChange={(e)=>setForm(f=>({...f, note: e.target.value}))}/>
        </label>

        <div className="flex gap-2">
          <button disabled={saving} className="bg-blue-600 text-white rounded px-4 py-2">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={()=>nav("/")} className="border rounded px-4 py-2">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
