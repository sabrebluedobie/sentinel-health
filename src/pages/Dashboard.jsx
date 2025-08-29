// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/components/AuthContext";
import { Glucose, SleepData } from "@/data/supabaseStore";
import supabase from "@/lib/supabase";

// Recharts
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const nav = useNavigate();

  const [g, setG] = useState({ last: null, series: [], loading: true });
  const [s, setS] = useState({ totalMin: 0, avgEff: null, loading: true });
  const [symData, setSymData] = useState([]); // [{name, value}]
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    let cancel = false;

    async function fetchAll() {
      try {
        setErr("");

        // --- Glucose (last 30d) ---
        const gres = await Glucose.listByDayRange(user.id, 30, 1000);
        const series = (gres ?? [])
          .map(r => ({ t: new Date(r.device_time).getTime(), v: Number(r.value_mgdl) }))
          .filter(p => isFinite(p.v))
          .sort((a, b) => a.t - b.t);
        const last = series.length ? series[series.length - 1].v : null;
        if (!cancel) setG({ last, series, loading: false });
        console.log("[Dashboard] Glucose points:", series.length, series.slice(-3));

        // --- Sleep summary (last 30d) ---
        const ss = await SleepData.summary(user.id, 30);
        if (!cancel) setS({ totalMin: ss.totalSleepMinutes || 0, avgEff: ss.avgEfficiency ?? null, loading: false });
        console.log("[Dashboard] Sleep summary:", ss);

        // --- Migraine symptoms breakdown (last 30d), read straight from table ---
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: mrows, error: me } = await supabase
          .from("migraine_entries")
          .select("symptoms,created_at")
          .eq("user_id", user.id)
          .gte("created_at", since)
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
          for (const k of norm(r.symptoms)) {
            counts.set(k, (counts.get(k) || 0) + 1);
          }
        }
        const pie = [...counts.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        if (!cancel) setSymData(pie);
        console.log("[Dashboard] Migraine symptoms:", pie);

      } catch (e) {
        console.error(e);
        if (!cancel) setErr(e.message || "Failed to load data");
      }
    }

    fetchAll();
    return () => { cancel = true; };
  }, [user, loading]);

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
              data={g.series.map(p => ({ t: new Date(p.t), v: p.v }))}
              margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
                minTickGap={24}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} formatter={(v) => [`${v} mg/dL`, "glucose"]} />
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {symData.map((_, i) => (
                  <Cell key={i} />
                ))}
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
      <div className="muted">{label}{sub ? ` — ${sub}` : ""}</div>
    </div>
  );
}
