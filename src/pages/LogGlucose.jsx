import React, { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function LogGlucose() {
  const [device_time, setDeviceTime] = useState("");
  const [value_mgdl, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setMsg({}); setBusy(true);

    if (!device_time || value_mgdl === "") {
      setBusy(false);
      setMsg({ kind: "error", text: "Please fill time and value." });
      return;
    }

    const payload = {
      device_time: new Date(device_time).toISOString(),
      value_mgdl: Number(value_mgdl),
    };

    const { error } = await supabase.from("glucose_readings").insert([payload]);
    setBusy(false);
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Saved ✓" });
    if (!error) { setValue(""); }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Log Glucose</h1>
          <Link to="/" className="btn-ghost no-underline text-sm">← Back</Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Time</label>
            <input
              type="datetime-local"
              className="input"
              value={device_time}
              onChange={(e) => setDeviceTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Value (mg/dL)</label>
            <input
              type="number"
              min="20"
              max="600"
              className="input"
              value={value_mgdl}
              onChange={(e) => setValue(e.target.value)}
              required
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