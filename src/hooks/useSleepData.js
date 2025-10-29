import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthContext";

/**
 * Pulls recent sleep sessions.
 * Assumes table: sleep_sessions (id, user_id, start_time, end_time, efficiency, stages JSON)
 * stages: { light, deep, rem, awake } minutes
 */
export function useSleepData({ days = 14 } = {}) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState({ light: 0, deep: 0, rem: 0, awake: 0 });
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
        .from("sleep_sessions")
        .select("id, start_time, end_time, efficiency, stages")
        .eq("user_id", user.id)
        .gte("start_time", since.toISOString())
        .order("start_time", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to fetch sleep data");
        setLoading(false);
        return;
      }
      const out = (rows || []).map(r => ({
        id: r.id,
        start: new Date(r.start_time),
        end: r.end_time ? new Date(r.end_time) : null,
        efficiency: r.efficiency == null ? null : Number(r.efficiency),
        stages: r.stages || { light: 0, deep: 0, rem: 0, awake: 0 },
        totalMinutes: (() => {
          if (!r.end_time) return null;
          const ms = new Date(r.end_time) - new Date(r.start_time);
          return Math.round(ms / 60000);
        })(),
      }));

      const sum = { light: 0, deep: 0, rem: 0, awake: 0 };
      for (const s of out) {
        sum.light += Number(s.stages?.light || 0);
        sum.deep  += Number(s.stages?.deep  || 0);
        sum.rem   += Number(s.stages?.rem   || 0);
        sum.awake += Number(s.stages?.awake || 0);
      }

      setSessions(out);
      setTotals(sum);
      setLoading(false);
    }

    fetchData();

    const ch = supabase.channel("sleep_changes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "sleep_sessions", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, days]);

  return { sessions, totals, loading, error };
}
