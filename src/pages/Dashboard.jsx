import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { useDailyMetrics, useMigraineCorrelations } from "@/hooks/useDailyMetrics";

export default function Dashboard() {
  const [range, setRange] = useState(30); // 7 / 30 / 90 / 120+
  const { rows, loading } = useDailyMetrics(range);
  const corr = useMigraineCorrelations(rows);

  const data = useMemo(() => {
    return (rows ?? []).map(r => ({
      day: new Date(r.day).toLocaleDateString(),
      pain: Number(r.avg_pain ?? 0),
      migraines: Number(r.migraine_count ?? 0),
      glucose: Number(r.avg_glucose ?? 0),
      sleep: Number(r.sleep_hours ?? 0),
    }));
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="font-medium">Range</div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`btn-ghost text-sm ${range === d ? "ring-2 ring-brand-600" : ""}`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={() => setRange(120)}
              className={`btn-ghost text-sm ${range === 120 ? "ring-2 ring-brand-600" : ""}`}
            >
              120d+
            </button>
          </div>
          <div className="ml-auto text-sm text-zinc-500">
            {loading ? "Loading…" : `${data.length} days`}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/log-glucose" className="card-link">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-lg font-semibold">Log Glucose</div>
              <div className="text-sm text-zinc-600">Manual mg/dL reading</div>
            </div>
          </div>
        </Link>

        <Link to="/log-sleep" className="card-link">
          <div className="flex items-center gap-3">
            <span className="text-2xl">😴</span>
            <div>
              <div className="text-lg font-semibold">Log Sleep</div>
              <div className="text-sm text-zinc-600">Record last night</div>
            </div>
          </div>
        </Link>

        <Link to="/log-migraine" className="card-link">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🙂</span>
            <div>
              <div className="text-lg font-semibold">Log Migraine</div>
              <div className="text-sm text-zinc-600">Pain 0–10 + notes</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-2 font-medium">Glucose ↔ Pain ({range}d)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" domain={[0, "auto"]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="glucose" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="pain" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="font-semibold mb-2">Insights (beta)</div>
          <ul className="text-sm space-y-1">
            <li>Glucose vs pain: <b>{fmt(corr.pain_vs_glucose)}</b></li>
            <li>Sleep vs pain: <b>{fmt(corr.pain_vs_sleep)}</b></li>
            <li>Yday glucose → pain: <b>{fmt(corr.pain_vs_glucose_lag1)}</b></li>
            <li>Yday sleep → pain: <b>{fmt(corr.pain_vs_sleep_lag1)}</b></li>
          </ul>
          <p className="text-xs text-zinc-500 mt-2">
            Correlation −1..1 (|0.5|≈moderate). Lag = yesterday’s value vs today’s pain.
          </p>
        </div>

        <div className="card lg:col-span-3">
          <div className="mb-2 font-medium">Sleep ↔ Pain ({range}d)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" domain={[0, "auto"]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="sleep" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="pain" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function fmt(v) {
  return v === null || Number.isNaN(v) ? "—" : Number(v).toFixed(2);
}