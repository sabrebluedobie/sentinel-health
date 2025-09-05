import { useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase";

// choose the fastest table by range (wrapper views over matviews)
function metricsTableForDays(days) {
  if (days <= 7)  return "dm7";
  if (days <= 30) return "dm30";
  if (days <= 90) return "dm90";
  return "daily_metrics";
}

export function useDailyMetrics(days = 30) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const table = metricsTableForDays(days);
      const sinceIso = new Date(Date.now() - days*24*3600*1000).toISOString();
      const q = table.startsWith("dm")
        ? supabase.from(table).select("*").order("day", { ascending: true })
        : supabase.from(table).select("*").gte("day", sinceIso).order("day", { ascending: true });
      const { data, error } = await q;
      if (!error) setRows(data ?? []);
      setLoading(false);
    })();
  }, [days]);

  return { rows, loading };
}

// simple Pearson + lag
const pearson = (xa, ya) => {
  const n = Math.min(xa.length, ya.length);
  const x=[], y=[];
  for (let i=0;i<n;i++){
    const a = Number(xa[i]), b = Number(ya[i]);
    if (Number.isFinite(a) && Number.isFinite(b)) { x.push(a); y.push(b); }
  }
  const m=x.length;
  if (m<3) return null;
  const mx = x.reduce((a,b)=>a+b,0)/m, my = y.reduce((a,b)=>a+b,0)/m;
  let num=0, dx=0, dy=0;
  for (let i=0;i<m;i++){ const vx=x[i]-mx, vy=y[i]-my; num+=vx*vy; dx+=vx*vx; dy+=vy*vy; }
  const den = Math.sqrt(dx*dy);
  return den ? +(num/den).toFixed(2) : null;
};
const lag1 = arr => arr.map((_,i)=> i>0 ? arr[i-1] : NaN);

export function useMigraineCorrelations(rows) {
  const pain = rows.map(r => Number(r.avg_pain ?? r.migraine_count ?? 0));
  const glucose = rows.map(r => Number(r.avg_glucose ?? NaN));
  const sleepH = rows.map(r => Number(r.sleep_hours ?? NaN));

  return useMemo(()=>({
    pain_vs_glucose: pearson(pain, glucose),
    pain_vs_sleep:   pearson(pain, sleepH),
    pain_vs_glucose_lag1: pearson(pain, lag1(glucose)),
    pain_vs_sleep_lag1:   pearson(pain, lag1(sleepH)),
  }), [rows]);
}