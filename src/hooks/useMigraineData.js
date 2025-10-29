import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthContext";

/**
 * Pulls recent migraine entries.
 * Assumes table: migraine_episodes (id, user_id, created_at, pain, symptoms[], notes)
 */
export function useMigraineData({ days = 30 } = {}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [byDay, setByDay] = useState([]);  // [{ date:'YYYY-MM-DD', count, avgPain }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const since = new Date();
    since.setDate(since.getDate() - days);

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("migraine_episodes")
        .select("id, created_at, pain, symptoms, notes")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to fetch migraine data");
        setLoading(false);
        return;
      }

      const out = (rows || []).map(r => ({
        id: r.id,
        time: new Date(r.created_at),
        pain: r.pain == null ? null : Number(r.pain),
        symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
        notes: r.notes || "",
      }));

      // Aggregate per day
      const map = new Map();
      for (const e of out) {
        const key = e.time.toISOString().slice(0, 10);
        const cur = map.get(key) || { date: key, count: 0, totalPain: 0, withPain: 0 };
        cur.count += 1;
        if (Number.isFinite(e.pain)) { cur.totalPain += e.pain; cur.withPain += 1; }
        map.set(key, cur);
      }
      const dayArr = [...map.values()]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({ date: d.date, count: d.count, avgPain: d.withPain ? +(d.totalPain / d.withPain).toFixed(1) : 0 }));

      setEntries(out);
      setByDay(dayArr);
      setLoading(false);
    }

    fetchData();

    const ch = supabase.channel("migraine_changes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "migraine_episodes", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, days]);

  return { entries, byDay, loading, error };
}
