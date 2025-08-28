// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/components/AuthContext";
import { Glucose, SleepData, Migraine } from "@/data/supabaseStore";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const nav = useNavigate();

  const [g, setG] = useState({ last: null, series: [], loading: true });
  const [s, setS] = useState({ totalMin: 0, avgEff: null, loading: true });
  const [m, setM] = useState({ count: 0, aura: 0, nausea: 0, loading: true });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    let cancel = false;

    async function run() {
      setErr("");
      try {
        // --- Glucose (7d) ---
        const rows = await Glucose.listByDayRange(user.id, 7, 500);
        const series = rows
          .map((r) => ({ t: new Date(r.device_time).getTime(), v: Number(r.value_mgdl) }))
          .sort((a, b) => a.t - b.t);
        const last = series.length ? series[series.length - 1].v : null;
        if (!cancel) setG({ last, series, loading: false });

        // --- Sleep summary (7d) ---
        const ss = await SleepData.summary(user.id, 7);
        if (!cancel)
          setS({
            totalMin: ss.totalSleepMinutes || 0,
            avgEff: ss.avgEfficiency ?? null,
            loading: false,
          });

        // --- Migraine summary (7d) ---
        const ms = await Migraine.summary(user.id, 7);
        if (!cancel)
          setM({
            count: ms.count || 0,
            aura: ms.withAura || 0,
            nausea: ms.withNausea || 0,
            loading: false,
          });
      } catch (e) {
        console.error(e);
        if (!cancel) setErr(e.message || "Failed to load data");
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [user, loading]);

  const gStats = useMemo(() => {
    if (!g.series.length) return null;
    let min = Infinity,
      max = -Infinity,
      sum = 0;
    for (const p of g.series) {
      if (p.v < min) min = p.v;
      if (p.v > max) max = p.v;
      sum += p.v;
    }
    const avg = sum / g.series.length;
    return { min, max, avg: Math.round(avg) };
  }, [g.series]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div className="card" style={{ padding: 16, borderRadius: 14, border: "1px solid var(--border,#eee)" }}>
          <h2 style={{ marginTop: 0 }}>Welcome</h2>
          <p>
            Please <Link to="/signin">sign in</Link> to see your dashboard.
          </p>
        </div>
      </div>
    );
  }

  const totalSleepHours = (s.totalMin || 0) / 60;
  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Dashboard</h1>
      {err && (
        <div
          className="card"
          style={{ border: "1px solid #fca5a5", background: "#fff7f7", padding: 12, borderRadius: 10, marginBottom: 12 }}
        >
          {err}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Link className="btn btn-primary" to="/log/glucose">
          Log Glucose
        </Link>
        <Link className="btn" to="/log/sleep">
          Log Sleep
        </Link>
        <Link className="btn" to="/log/migraine">
          Log Migraine
        </Link>
        <Link className="btn" to="/settings" style={{ marginLeft: "auto" }}>
          Settings
        </Link>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {/* Glucose */}
        <div className="card" style={{ border: "1px solid var(--border,#eee)", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Blood Glucose (7d)</h3>
            <Link to="/log/glucose" style={{ marginLeft: "auto", fontSize: 13 }}>
              Log
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{g.loading ? "—" : g.last ?? "—"}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              mg/dL
            </div>
          </div>
          <div style={{ color: "var(--primary,#1a73e8)", marginBottom: 8 }}>
            <Sparkline data={g.series} width={360} height={60} />
          </div>
          <div className="muted" style={{ fontSize: 12, display: "flex", gap: 16 }}>
            <span>Min: {gStats ? gStats.min : "—"}</span>
            <span>Avg: {gStats ? gStats.avg : "—"}</span>
            <span>Max: {gStats ? gStats.max : "—"}</span>
          </div>
        </div>

        {/* Sleep */}
        <div className="card" style={{ border: "1px solid var(--border,#eee)", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Sleep (last 7 days)</h3>
            <Link to="/log/sleep" style={{ marginLeft: "auto", fontSize: 13 }}>
              Log
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{totalSleepHours.toFixed(1)}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              hours total
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Avg efficiency: {s.loading ? "—" : s.avgEff != null ? `${Math.round(s.avgEff)}%` : "—"}
          </div>
        </div>

        {/* Migraines */}
        <div className="card" style={{ border: "1px solid var(--border,#eee)", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Migraines (7d)</h3>
            <Link to="/log/migraine" style={{ marginLeft: "auto", fontSize: 13 }}>
              Log
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{m.loading ? "—" : m.count}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              episodes
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12, display: "grid", gap: 4 }}>
            <span>With aura: {m.loading ? "—" : m.aura}</span>
            <span>With nausea: {m.loading ? "—" : m.nausea}</span>
          </div>
        </div>
      </div>

      {/* Secondary actions */}
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="btn" href={`/api/export/health-provider?user_id=${encodeURIComponent(user.id)}`}>Export for provider</a>
        <Link className="btn" to="/settings">Connect devices</Link>
      </div>
    </div>
  );
}

/** Simple SVG sparkline with auto-scaling */
function Sparkline({ data, width = 360, height = 60, padding = 4, strokeWidth = 2 }) {
  if (!data?.length) {
    return (
      <div className="muted" style={{ fontSize: 12 }}>
        No data
      </div>
    );
  }
  const xs = data.map((d) => d.t);
  const ys = data.map((d) => d.v);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    // expand a flat line a bit so you can see it
    minY -= 1;
    maxY += 1;
  }

  const w = width;
  const h = height;
  const px = padding;
  const py = padding;

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const points = data.map((d) => {
    const x = px + ((d.t - minX) / rangeX) * (w - px * 2);
    const y = h - py - ((d.v - minY) / rangeY) * (h - py * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const dAttr = `M ${points.join(" L ")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Glucose trend">
      <path d={dAttr} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
