// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../components/AuthContext";
import { useGlucoseData } from "../hooks/useGlucoseData";
import { useSleepData } from "../hooks/useSleepData";
import { useMigraineData } from "../hooks/useMigraineData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#ef4444"]; // light, deep, rem, awake

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: glucose, loading: gLoading, error: gErr } = useGlucoseData({ days: 7 });
  const { sessions, totals, loading: sLoading, error: sErr } = useSleepData({ days: 14 });
  const { byDay: migDays, loading: mLoading, error: mErr } = useMigraineData({ days: 30 });

  if (authLoading) return <div className="container" style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <div className="container" style={{ padding: 16 }}>Please sign in to view your dashboard.</div>;

  return (
    <div className="container" style={{ padding: 16, display: "grid", gap: 16 }}>
      {/* Glucose */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Blood Glucose (last 7 days)</h2>
        {gErr && <div className="muted" style={{ color: "#d00" }}>{gErr}</div>}
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={glucose.map(d => ({ time: d.time, mgdl: d.mgdl }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
              <Legend />
              <Line type="monotone" dataKey="mgdl" name="mg/dL" stroke="#1a73e8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Sleep */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Sleep Stages (14 days)</h2>
        {sErr && <div className="muted" style={{ color: "#d00" }}>{sErr}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Light", value: totals.light },
                    { name: "Deep",  value: totals.deep  },
                    { name: "REM",   value: totals.rem   },
                    { name: "Awake", value: totals.awake },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} min`, "Minutes"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessions.map(s => ({
                  date: s.start.toISOString().slice(0,10),
                  eff: s.efficiency == null ? 0 : s.efficiency,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Efficiency"]} />
                <Legend />
                <Bar dataKey="eff" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Migraines */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Migraines (30 days)</h2>
        {mErr && <div className="muted" style={{ color: "#d00" }}>{mErr}</div>}
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={migDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Count" />
              <Bar dataKey="avgPain" name="Avg Pain" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
