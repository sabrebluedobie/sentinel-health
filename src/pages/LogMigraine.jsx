import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LogMigraine() {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  async function fetchRows(uid) {
    const { data } = await supabase
      .from("migraine_episodes")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(200);
    setRows(data || []);
  }

  useEffect(() => {
    if (!userId) return;
    fetchRows(userId);
    const ch = supabase.channel(`migraine:${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "migraine_episodes", filter: `user_id=eq.${userId}` },
      () => fetchRows(userId)
    ).subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supabase.from("migraine_episodes").insert({
      user_id: userId,
      date,
      intensity,
      notes: notes || null
    });
    if (!error) setNotes("");
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto" }}>
      <h2>Log Migraine</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
        <label>Intensity (1–10)</label>
        <input type="number" min={1} max={10} value={intensity} onChange={(e)=>setIntensity(parseInt(e.target.value || 1, 10))} />
        <label>Notes</label>
        <input value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="optional" />
        <button>Add</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Your episodes</h3>
      <ul>
        {rows.map(r => (
          <li key={r.id}>{r.date} — intensity {r.intensity}{r.notes ? ` — ${r.notes}` : ""}</li>
        ))}
      </ul>
    </div>
  );
}
