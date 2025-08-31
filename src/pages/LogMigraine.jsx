import React, { useState } from "react";
import supabase from "@/lib/supabase";

export default function LogMigraine() {
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
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

    const sev = Number(severity);
    if (!Number.isFinite(sev) || sev < 1 || sev > 10) {
      return setMsg("Severity must be a number between 1 and 10.");
    }

    setSaving(true);
    const { error } = await supabase.from("migraine_logs").insert({
      user_id: uid,
      severity: sev,
      notes: notes || null,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return setMsg(`Save failed: ${error.message}`);
    setNotes("");
    setSeverity(5);
    setMsg("Saved ✓");
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Log Migraine</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Severity (1–10)
          <input
            type="number"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          />
        </label>
        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button>
        <div style={{ minHeight: 20, color: msg.startsWith("Saved") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
