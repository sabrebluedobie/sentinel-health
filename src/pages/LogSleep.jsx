import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LogSleep() {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [minutes, setMinutes] = useState(420);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setUserId(data?.user?.id ?? null);
    })();
    return () => { active = false; };
  }, []);

  async function fetchRows(uid) {
    const { data, error } = await supabase
      .from("Sleep_Data")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(100);
    if (!error) setRows(data || []);
  }

  useEffect(() => {
    if (!userId) return;

    fetchRows(userId);

    const channel = supabase
      .channel(`sleep-data:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Sleep_Data", filter: `user_id=eq.${userId}` },
        () => fetchRows(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supabase.from("Sleep_Data").insert({
      user_id: userId,
      date,            // ISO date string (YYYY-MM-DD)
      minutes,         // integer minutes slept
      notes: notes || null,
    });
    if (!error) {
      setNotes("");
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto" }}>
      <h2>Log Sleep</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />

        <label>Minutes Slept</label>
        <input type="number" value={minutes} onChange={(e)=>setMinutes(parseInt(e.target.value || 0, 10))} min={0} required />

        <label>Notes</label>
        <input value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="optional" />

        <button>Add</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Your recent sleep</h3>
      <ul>
        {rows.map(r => (
          <li key={r.id}>
            {r.date} — {(r.minutes/60).toFixed(1)}h {r.notes ? `— ${r.notes}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
