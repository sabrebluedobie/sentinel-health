import React, { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function LogSleep() {
  const [start_time, setStart] = useState("");
  const [end_time, setEnd] = useState("");
  const [efficiency, setEff] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  function hoursBetween(isoStart, isoEnd) {
    const s = new Date(isoStart).getTime();
    const e = new Date(isoEnd).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
    return Math.round(((e - s) / 36e5) * 100) / 100; // hours, 2 decimals
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg({}); setBusy(true);

    if (!start_time || !end_time) {
      setBusy(false);
      setMsg({ kind: "error", text: "Start and End are required." });
      return;
    }

    const startISO = new Date(start_time).toISOString();
    const endISO = new Date(end_time).toISOString();
    const total_sleep_hours = hoursBetween(startISO, endISO);

    if (total_sleep_hours === null) {
      setBusy(false);
      setMsg({ kind: "error", text: "End must be after Start." });
      return;
    }

    const payload = {
      start_time: startISO,
      end_time: endISO,
      total_sleep_hours,
      efficiency: efficiency === "" ? null : Number(efficiency),
    };

    const { error } = await supabase.from("sleep_data").insert([payload]);
    setBusy(false);
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Saved ✓" });
    if (!error) {
      setStart(""); setEnd(""); setEff("");
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Log Sleep</h1>
          <Link to="/" className="btn-ghost no-underline text-sm">← Back</Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Start</label>
            <input
              type="datetime-local"
              className="input"
              value={start_time}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">End</label>
            <input
              type="datetime-local"
              className="input"
              value={end_time}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>

         