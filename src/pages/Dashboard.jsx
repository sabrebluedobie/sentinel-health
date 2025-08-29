// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import supabase from "@/lib/supabase";

// Recharts
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

const PIE_COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
  "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
  "#bcbd22", "#17becf"
];

function msAgo(days) { return Date.now() - days * 86400000; }

export default function Dashboard() {
  const { user, session, loading } = useAuth();
  const nav = useNavigate();

  const [g, setG] = useState({ last: null, series: [], loading: true });
  const [s, setS] = useState({ totalMin: 0, avgEff: null, loading: true });
  const [symData, setSymData] = useState([]); // [{name, value}]
  const [err, setErr] = useState("");

  // Redirect to sign-in if not authenticated (in case a route guard isn’t wrapping)
  useEffect(() => {
    if (!loading && !user) nav("/signin", { replace: true });
  }, [loading, user, nav]);

  const refreshAll = async () => {
    if (!user) return;
    setErr("");

    try {
      // ---------- Glucose (last 30d) ----------
      const sinceISO = new Date(msAgo(30)).toISOString();
      const { data: gres, error: ge } = await supabase
        .from("glucose_readings")
        .select("device_time,value_mgdl")
        .eq("user_id", user.id)
        .gte("device_time", sinceISO)
        .order("device_time", { ascending: true })
        .limit(2000);
      if (ge) throw ge;

      const series = (gres ?? [])
        .map(r => ({ t: new Date(r.device_time).getTime(), v: Number(r.value_mgdl) }))
        .filter(p => isFinite(p.v))
        .sort((a, b) => a.t - b.t);
      const last = series.length ? series[series.length - 1].v : null;
      setG({ last, series, loading: false });
      console.log("[Dashboard] Glucose points:", series.length, series.slice(-3));

      // ---------- Sleep summary (last 30d) ----------
      // Select * defensively since schemas vary (end_time vs end_ts, etc.)
      const { data: srows, error: se } = await supabase
        .from("sleep_data")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", sinceISO) // harmless if null for some rows
        .order("start_time", { ascending: true })
        .limit(5000);
      if (se) throw se;

      let totalMin = 0, effSum = 0, effCount = 0;
      for (const r of srows ?? []) {
        const start = r.start_time ?? r.start_ts ?? null;
        const end   = r.end_time ?? r.end_ts ?? null;
        if (start && end) {
          const minutes = (new Date(end) - new Date(start)) / 60000;
          if (isFinite(minutes) && minutes > 0) totalMin += minutes;
        }
        if (r.efficiency != null) {
          const e = Number(r.efficiency);
          if (isFinite(e)) { effSum += e; effCount++; }
        }
      }
      const sleepSummary = {
        totalMin: Math.round(totalMin),
        avgEff: effCount ? effSum / effCount : null,
        loading: false
      };
      setS(sleepSummary);
      console.log("[Dashboard] Sleep summary:", sleepSummary);

      // ---------- Migraine symptoms (last 30d) ----------
      const { data: mrows, error: me } = await supabase
        .from("migraine_entries")
        .select("symptoms,created_at")
        .eq("user_id", user.id)
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true })
        .limit(5000);
      if (me) throw me;

      const counts = new Map();
      const norm = (sym) => {
        if (Array.isArray(sym)) return sym.map(s => String(s).toLowerCase().trim());
        if (typeof sym === "string") {
          try {
            const arr = JSON.parse(sym);
            if (Array.isArray(arr)) return arr.map(s => String(s).toLowerCase().trim());
          } catch { /* not JSON */ }
          return sym.split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
        }
        return [];
      };
      for (const r of mrows ?? []) {
        for (const k of norm(r.symptoms)) counts.set(k, (counts.get(k) || 0) + 1);
      }
      const pie = [...counts.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setSymData(pie);
      console.log("[Dashboard] Migraine symptoms:", pie);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load data");
    }
  };

  // Initial load
  useEffect(() => {
    if (!user || loading) return;
    refreshAll();
  }, [user?.id, loading]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime:dashboard")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "migraine_entries", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Derived chart data for Recharts
  const glucoseChartData = useMemo(() => (
    g.series.map(p => ({ t: new Date(p.t), v: p.v }))
  ), [g.series]);

  if (loading || (!user && !err)) {
    return <div className="container" style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Dashboard</h1>

      {err && (
        <div className="card" style={{ border: "1px solid #fca5a5", background: "#fff7f7", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* Quick actions (behind sign-in only) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Link className="btn" to="/settings">Settings</Link>
        <Link className="btn" to="/log-glucose">Log glucose</Link>
        <Link className="btn" to="/log-sleep">Log sleep</Link>
        <Link className="btn" to="/log-migraine">Log migraine</Link>
      </div>

      {/* Glucose card */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Blood glucose</h2>
          <div className="muted">last 30 days</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {g.last == null ? "—" : `${g.last} mg/dL`}
          </div>
          <div className="muted">latest reading</div>
        </div>

        <div style={{ height: 220, marginTop: 12 }}>
          <ResponsiveContainer>
            <LineChart
              data={glucoseChartData}
              margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
                minTickGap={24}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleString()}
                formatter={(v) => [`${v} mg/dL`, "glucose"]}
              />
              <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {!g.series.length && <div className="muted" style={{ marginTop: 8 }}>No glucose data yet.</div>}
      </div>

      {/* Sleep card */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Sleep (30d)</h2>
          <div className="muted">efficiency is average</div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
          <Metric label="Total sleep" value={`${Math.round(s.totalMin / 60)} h`} sub={`${s.totalMin} min`} />
          <Metric label="Avg. efficiency" value={s.avgEff == null ? "—" : `${s.avgEff.toFixed(0)}%`} />
        </div>
      </div>

      {/* Migraine symptoms pie */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Recent migraine symptoms</h2>
          <div className="muted">last 30 days</div>
        </div>

        <div style={{ height: 260, marginTop: 12 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={symData.length ? symData : [{ name: "no data", value: 1 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(symData.length ? symData : [{ name: "no data", value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {!symData.length && <div className="muted" style={{ marginTop: 8 }}>No migraine entries yet.</div>}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="muted">{label}{sub ? ` — ${sub}` : ""}</div>
    </div>
  );
}
