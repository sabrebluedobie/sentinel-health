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
        // Prefer materialized views if present
        const view =
          rangeDays <= 7 ? "daily_metrics_7" :
          rangeDays <= 30 ? "daily_metrics_30" :
          rangeDays <= 90 ? "daily_metrics_90" :
          "daily_metrics_all";

        let { data, error } = await supabase
          .from(view)
          .select("*")
          .order("day", { ascending: true });

        // Fallback to simple RPCs/aggregations if the views/tables aren’t there yet
        if (error) {
          let g = [], s = [], m = [];
          try { ({ data: g = [] } = await supabase.rpc("dm_glucose_simple", { days: rangeDays })); } catch {}
          try { ({ data: s = [] } = await supabase.rpc("dm_sleep_simple",   { days: rangeDays })); } catch {}
          try { ({ data: m = [] } = await supabase.rpc("dm_migraine_simple",{ days: rangeDays })); } catch {}

          const byDay = new Map();

          (g || []).forEach(r => {
            byDay.set(r.day, { day: r.day, avg_glucose: r.avg_glucose });
          });

          (s || []).forEach(r => {
            let d = byDay.get(r.day);
            if (!d) { d = { day: r.day }; byDay.set(r.day, d); }
            Object.assign(d, { sleep_hours: r.sleep_hours });
          });

          (m || []).forEach(r => {
            let d = byDay.get(r.day);
            if (!d) { d = { day: r.day }; byDay.set(r.day, d); }
            Object.assign(d, { avg_pain: r.avg_pain, migraine_count: r.migraine_count });
          });

          data = Array.from(byDay.values()).sort((a, b) =>
            String(a.day).localeCompare(String(b.day))
          );
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