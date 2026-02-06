// src/hooks/useSignals.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { mapDailyMetricsToSignals } from "@/lib/insights/mapDailyMetricsToSignals.js";

/**
 * Derive signals from glucose_readings rows.
 * This is schema-tolerant:
 * - glucose value: value | mg_dl | glucose | reading | glucose_mgdl
 * - timestamp: taken_at | created_at | measured_at | timestamp | reading_time
 */
function mapGlucoseReadingsToSignals(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const getValue = (r) => {
    const v =
      r?.value ??
      r?.value_mgdl ??
      r?.mg_dl ??
      r?.glucose ??
      r?.reading ??
      r?.glucose_mgdl ??
      null;

    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? n : null;
  };

  const getTime = (r) => {
    const t =
      r?.device_time ??
      r?.taken_at ??
      r?.measured_at ??
      r?.reading_time ??
      r?.timestamp ??
      r?.created_at ??
      null;

    const d = t ? new Date(t) : null;
    return d instanceof Date && Number.isFinite(d.getTime()) ? d : null;
  };

  // Filter to usable readings
  const readings = rows
    .map((r) => ({ v: getValue(r), t: getTime(r) }))
    .filter((x) => x.v !== null && x.t !== null)
    .sort((a, b) => a.t - b.t);

  if (readings.length === 0) return [];

  // Simple, reliable signals:
  // 1) High glucose variability (max - min)
  const values = readings.map((x) => x.v);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const signals = [];

  if (readings.length >= 3 && range >= 30) {
    signals.push({
      label: "High glucose variability",
      severity: range >= 50 ? "high" : "medium",
      delta: range,
      category: "glucose",
      actionable: false,
      timeSensitive: false,
      informational: false,
    });
  }

  // 2) “Highs cluster in time-of-day” (bucket high readings by time)
  // Thresholds are placeholders; adjust to your product rules later.
  const HIGH = 180;

  const bucket = (date) => {
    const h = date.getHours();
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "afternoon";
    if (h >= 17 && h < 22) return "evening";
    return "night";
  };

  const highs = readings.filter((x) => x.v >= HIGH);
  if (highs.length >= 2) {
    const counts = highs.reduce((acc, x) => {
      const b = bucket(x.t);
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});

    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      const [timeOfDay, ct] = top;
      const sev = ct >= 5 ? "high" : ct >= 3 ? "medium" : "low";

      signals.push({
        label: `High glucose readings cluster in the ${timeOfDay}`,
        severity: sev,
        delta: ct,
        category: "glucose",
        actionable: true,
        timeSensitive: true,
        informational: false,
      });
    }
  }

  return signals;
}

export function useSignals(user) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      
      if (!user?.id) {
        if (mounted) {
          setSignals([]);
          setLoading(false);
        }
        return;
      }

      

      // Pull both sources in parallel
      const [dailyRes, glucoseRes] = await Promise.all([
        supabase
          .from("daily_metrics")
          .select("*")
          .eq("user_id", user.id)
          .order("day", { ascending: false })
          .limit(14),

        // Pull recent glucose readings; adjust limit as needed
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (!mounted) return;

            if (dailyRes.error) {
              console.error("useSignals daily_metrics error:", dailyRes.error);
            }
            if (glucoseRes.error) {
              console.error("useSignals glucose_readings error:", glucoseRes.error);
            }
      
            const dailySignals = Array.isArray(dailyRes.data)
              ? mapDailyMetricsToSignals(dailyRes.data)
              : [];
      
            const glucoseSignals = Array.isArray(glucoseRes.data)
              ? mapGlucoseReadingsToSignals(glucoseRes.data)
              : [];
      
            if (mounted) {
              setSignals([...dailySignals, ...glucoseSignals]);
              setLoading(false);
            }
          }
      
          load();

          setLoading(false);
      
          return () => {
            mounted = false;
          };
        }, [user?.id]);
      
        return { signals, loading };
      }
