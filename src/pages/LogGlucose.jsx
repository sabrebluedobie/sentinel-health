import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function LogGlucose() {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
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

    const mgdl = Number(value);
    if (!Number.isFinite(mgdl) || mgdl < 20 || mgdl > 600) {
      return setMsg("Please enter a glucose value between 20 and 600 mg/dL.");
    }

    setSaving(true);
    const row = {
      user_id: uid,
      device_time: new Date().toISOString(),
      value_mgdl: mgdl,
      trend: null,
      source: "manual",
      note: note || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("glucose_readings").insert(row);
    setSaving(false);
    if (error) return setMsg(`Save failed: ${error.message}`);
    setValue("");
    setNote("");
    setMsg("Saved ✓");
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Log Glucose</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Value (mg/dL)
          <input
            type="number"
            inputMode="numeric"
            min="20"
            max="600"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <label>
          Note (optional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., after lunch"
          />
        </label>
        <button disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        <div style={{ minHeight: 20, color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
