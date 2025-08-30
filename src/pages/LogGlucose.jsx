import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LogGlucose() {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [value, setValue] = useState(110);
  const [ts, setTs] = useState(() => new Date().toISOString().slice(0,16)); // local datetime input

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  async function fetchRows(uid) {
    const { data } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", uid)
      .order("measured_at", { ascending: false })
      .limit(200);
    setRows(data || []);
  }

  useEffect(() => {
    if (!userId) return;
    fetchRows(userId);
    const ch = supabase.channel(`glucose:${userId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${userId}` },
      () => fetchRows(userId)
    ).subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supabase.from("glucose_readings").insert({
      user_id: userId,
      value_mgdl: value,
      measured_at: new Date(ts).toISOString()
    });
    if (!error) setValue(110);
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto" }}>
      <h2>Log Glucose</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <label>mg/dL</label>
        <input type="number" value={value} onChange={(e)=>setValue(parseInt(e.target.value || 0, 10))} min={20} max={600} required />
        <label>Time</label>
        <input type="datetime-local" value={ts} onChange={(e)=>setTs(e.target.value)} required />
        <button>Add</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Your readings</h3>
      <ul>
        {rows.map(r => (
          <li key={r.id}>{new Date(r.measured_at).toLocaleString()} — {r.value_mgdl} mg/dL</li>
        ))}
      </ul>
    </div>
  );
}
