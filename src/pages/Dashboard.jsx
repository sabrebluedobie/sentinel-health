// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/components/AuthContext";
import supabase from "@/lib/supabase";

// Recharts
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const nav = useNavigate();

  // ---- UI state ----
  const [g, setG] = useState({ last: null, series: [], loading: true });
  const [s, setS] = useState({ totalMin: 0, avgEff: null, loading: true });
  const [symData, setSymData] = useState([]); // [{name, value}]
  const [err, setErr] = useState("");

  // 30-day window
  const sinceISO = useMemo(
    () => new Date(Date.now() - 30 * 86400000).toISOString(),
    []
  );

  // ---------- fetchers ----------
  async function fetchGlucose() {
    if (!user) return;
    const { data, error } = await supabase
      .from("glucose_readings")
      .select("device_time,value_mgdl")
      .eq("user_id", user.id)
      .gte("device_time", sinceISO)
      .order("device_time", { ascending: true })
      .limit(2000);

    if (error) throw error;

    const series = (data ?? [])
      .map(r => ({ t: new Date(r.device_time).getTime(), v: Number(r.value_mgdl) }))
      .filter(p => isFinite(p.v))
      .sort((a, b) => a.t - b.t);

    const last = series.length ? series[series.length - 1].v : null;
    setG({ last, series, loading: false });
    // Debug
    console.log("[Dashboard] Glucose points:", series.length);
  }

  async function fetchSleep() {
    if (!user) return;
    // NOTE: using start/stop per your actual table (no end_time)
    const { data, error } = await supabase
      .from("sleep_data")
      .select("start,stop,efficiency")
      .eq("user_id", user.id)
      .gte("start", sinceISO)
      .order("start", { ascending: true })
      .limit(5000);

    if (error) throw error;

    let totalMin = 0;
    let effSum = 0;
    let effCount = 0;

    for (const r of data ?? []) {
      if (r.start && r.stop) {
        const min = (new Date(r.stop) - new Date(r.start)) / 60000;
        if (isFinite(min) && min > 0) totalMin += min;
      }
      if (r.efficiency != null) {
        const e = Number(r.efficiency);
        if (isFinite(e)) {
          effSum += e;
          effCount++;
        }
      }
    }

    setS({
      totalMin: Math.round(totalMin),
      avgEff: effCount ? effSum / effCount : null,
      loading: false,
    });
    console.log("[Dashboard] Sleep summary:", { totalMin, avg: effCount ? effSum / effCount : null });
  }

  async function fetchMigraines() {
    if (!user) return;

    const { data, error } = await supabase
      .from("migraine_entries")
      .select("symptoms,created_at")
      .eq("user_id", user.id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true })
      .limit(5000);

    if (error) throw error;

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

    for (const r of data ?? []) {
      for (const k of norm(r.symptoms)) {
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }

    const pie = [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setSymData(pie);
    console.log("[Dashboard] Migraine symptoms:", pie);
  }

  // ---------- initial load ----------
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        await Promise.all([fetchGlucose(), fetchSleep(), fetchMigraines()]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e.message || "Failed to load data");
      }
    })();

    return () => { cancelled = true; };
  }, [user, loading]); // run when auth ready

  // ---------- REALTIME listeners ----------
  // Place this AFTER the fetch* functions (already done here).
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("glucose_feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${user.id}` },
          () => fetchGlucose()
        )
        .subscribe(),

      supabase
        .channel("sleep_feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${user.id}` },
          () => fetchSleep()
        )
        .subscribe(),

      supabase
        .channel("migraine_feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "migraine_entries", filter: `user_id=eq.${user.id}` },
          () => fetchMigraines()
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, [user?.id]);

  // ---------- UI ----------
  if (loading) {
    return <div className="container" style={{ padding: 24 }}>Loading…</div>;
  }
  if (!user) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div className="card" style={{ padding: 16, borderRadius: 14, border: "1px solid var(--border,#eee)" }}>
          <h2 style={{ marginTop: 0 }}>Welcome</h2>
          <p>Please <Link to="/signin">sign in</Link> to see your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Dashboard</h1>
      {err && (
        <div className="card" style={{ border: "1px solid #fca5a5", background: "#fff7f7", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* Quick actions */}
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
              data={g.series.map(p => ({ t: p.t, v: p.v }))}
              margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                minTickGap={24}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                formatter={(v) => [`${v} mg/dL`, "glucose"]}
              />
              <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {!g.series.length && <div className="muted">No glucose data yet.</div>}
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
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {symData.map((_, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {!symData.length && <div className="muted">No migraine entries yet.</div>}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="muted">
        {label}{sub ? ` — ${sub}` : ""}
      </div>
    </div>
  );
}
