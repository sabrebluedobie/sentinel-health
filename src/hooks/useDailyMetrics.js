import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function useDailyMetrics(rangeDays = 30) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        // Try materialized views if you created them; else fallback to raw aggregations
        // Attempt 1: daily_metrics_{range}
        const view = rangeDays <= 7 ? "daily_metrics_7"
                   : rangeDays <= 30 ? "daily_metrics_30"
                   : rangeDays <= 90 ? "daily_metrics_90"
                   : "daily_metrics_all";
        let { data, error } = await supabase.from(view).select("*").order("day", { ascending: true });
        if (error) {
          // Fallback: compute simple per-day aggregates from base tables
          const { data: g } = await supabase.rpc("dm_glucose_simple", { days: rangeDays }).catch(()=>({data:[]}));
          const { data: s } = await supabase.rpc("dm_sleep_simple", { days: rangeDays }).catch(()=>({data:[]}));
          const { data: m } = await supabase.rpc("dm_migraine_simple", { days: rangeDays }).catch(()=>({data:[]}));
          const byDay = new Map();
          (g||[]).forEach(r => byDay.set(r.day, { day: r.day, avg_glucose: r.avg_glucose }));
          (s||[]).forEach(r => Object.assign(byDay.get(r.day) ??= { day: r.day }, { sleep_hours: r.sleep_hours }));
          (m||[]).forEach(r => Object.assign(byDay.get(r.day) ??= { day: r.day }, { avg_pain: r.avg_pain, migraine_count: r.migraine_count }));
          data = Array.from(byDay.values()).sort((a,b)=>a.day.localeCompare(b.day));
        }
        if (!cancelled) setRows(data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [rangeDays]);

  return { rows, loading };
}