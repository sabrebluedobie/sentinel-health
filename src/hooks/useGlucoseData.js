import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthContext";

/**
 * Pulls recent glucose readings for the current user.
 * Assumes table: glucose_readings (id, user_id, device_time, value_mgdl, source, note)
 */
export function useGlucoseData({ days = 7 } = {}) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const since = new Date();
    since.setDate(since.getDate() - days);

    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("glucose_readings")
        .select("id, device_time, value_mgdl, source, note")
        .eq("user_id", user.id)
        .gte("device_time", since.toISOString())
        .order("device_time", { ascending: true });

      if (isCancelled) return;

      if (error) {
        setError(error.message || "Failed to fetch glucose data");
        setLoading(false);
      } else {
        const out = (rows || [])
          .map(r => ({
            id: r.id,
            time: new Date(r.device_time),
            mgdl: Number(r.value_mgdl),
            source: r.source || "manual",
            note: r.note || "",
          }))
          .filter(p => Number.isFinite(p.mgdl));
        setData(out);
        setLoading(false);
      }
    }

    fetchData();

    // Realtime inserts
    const ch = supabase.channel("glucose_changes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "glucose_readings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const r = payload.new;
          setData(prev => [...prev, {
            id: r.id,
            time: new Date(r.device_time),
            mgdl: Number(r.value_mgdl),
            source: r.source || "manual",
            note: r.note || "",
          }]);
        }
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, days]);

  return { data, loading, error };
}
