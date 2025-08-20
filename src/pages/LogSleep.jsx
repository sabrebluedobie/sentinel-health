// src/pages/LogSleep.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SleepData } from "@/entities/client";

export default function LogSleep() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    start_time: "",
    end_time: "",
    efficiency: "",
    stages: { light: "", deep: "", rem: "", awake: "" },
    note: "",
    source: "manual",
  });
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      efficiency: form.efficiency ? Number(form.efficiency) : null,
      stages: {
        light: Number(form.stages.light || 0),
        deep: Number(form.stages.deep || 0),
        rem: Number(form.stages.rem || 0),
        awake: Number(form.stages.awake || 0),
      },
      date: form.start_time || new Date().toISOString(), // for simple sorting in dashboard helpers
      created_at: new Date().toISOString(),
    };
    await SleepData.create(payload);
    setSaving(false);
    nav("/"); // back to Dashboard
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log Sleep</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Start time</span>
          <input type="datetime-local" className="w-full border rounded p-2"
            value={form.start_time}
            onChange={(e)=>setForm(f=>({...f, start_time: e.target.value}))}
            required/>
        </label>

        <label className="block">
          <span className="text-sm font-medium">End time</span>
          <input type="datetime-local" className="w-full border rounded p-2"
            value={form.end_time}
            onChange={(e)=>setForm(f=>({...f, end_time: e.target.value}))}
            required/>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Efficiency (0–100)</span>
          <input type="number" min="0" max="100" className="w-full border rounded p-2"
            value={form.efficiency}
            onChange={(e)=>setForm(f=>({...f, efficiency: e.target.value}))}/>
        </label>

        <fieldset className="border rounded p-3">
          <legend className="text-sm font-medium px-1">Stages (minutes)</legend>
          <div className="grid grid-cols-2 gap-3">
            {["light","deep","rem","awake"].map(k=>(
              <label key={k} className="block">
                <span className="text-xs uppercase">{k}</span>
                <input type="number" min="0" className="w-full border rounded p-2"
                  value={form.stages[k]}
                  onChange={(e)=>setForm(f=>({...f, stages:{...f.stages, [k]: e.target.value}}))}/>
              </label>
            ))}
          </div>
        </fieldset>

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
