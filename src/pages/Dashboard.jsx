import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import useDailyMetrics from "@/hooks/useDailyMetrics";
import useMigraineCorrelations from "@/hooks/useMigraineCorrelations";
import ChartCard from "@/components/ChartCard.jsx";

export default function Dashboard() {
  const [range, setRange] = useState(30);

  const dm = (typeof useDailyMetrics === "function" && useDailyMetrics(range)) || { rows: [], loading: false, error: null };
  const rows = dm?.rows ?? [];
  const loading = dm?.loading ?? false;

  const corr = (typeof useMigraineCorrelations === "function" && useMigraineCorrelations(rows)) || {
    pain_vs_glucose: null, pain_vs_sleep: null, pain_vs_glucose_lag1: null, pain_vs_sleep_lag1: null
  };

  // Normalize data the charts will use
  const data = useMemo(
    () => rows.map(r => ({
      day: new Date(r.day ?? r.date ?? r.started_at ?? Date.now()).toLocaleDateString(),
      migraine_count: Number(r.migraine_count ?? r.count ?? 0),
      pain: Number(r.avg_pain ?? r.pain ?? 0),
      glucose: Number(r.avg_glucose ?? r.glucose ?? 0),
      sleep: Number(r.sleep_hours ?? r.total_sleep_hours ?? 0),
    })),
    [rows]
  );

  return (
    <div className="space-y-6">
      {/* Range + quick actions */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-5">
        <div className="flex items-center gap-3">
          <div className="font-medium">Range</div>
          <div className="flex gap-2">
            {[7,30,90].map(d=>(
              <button key={d} onClick={()=>setRange(d)} className={`px-3 py-1.5 rounded-md text-sm border ${range===d?"bg-blue-50 border-blue-600 text-blue-800":"border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}>
                {d}d
              </button>
            ))}
            <button onClick={()=>setRange(120)} className={`px-3 py-1.5 rounded-md text-sm border ${range===120?"bg-blue-50 border-blue-600 text-blue-800":"border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}>
              120d+
            </button>
          </div>
          <div className="ml-auto text-sm text-zinc-500">
            {loading ? "Loading…" : `${data.length} days`}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link to="/log-glucose" className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
            <div className="text-sm font-medium">Log Glucose</div>
            <div className="text-xs text-zinc-500">Manual mg/dL reading</div>
          </Link>
          <Link to="/log-sleep" className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
            <div className="text-sm font-medium">Log Sleep</div>
            <div className="text-xs text-zinc-500">Record last night</div>
          </Link>
          <Link to="/log-migraine" className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50">
            <div className="text-sm font-medium">Log Migraine</div>
            <div className="text-xs text-zinc-500">Pain 0–10 + notes</div>
          </Link>
        </div>
      </div>

      {/* NEW: Three light “box” cards for the logs */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Migraine days */}
        <ChartCard title={`Migraine Days (${range}d)`} subtitle="Daily count of migraine entries">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip />
                {/* dark red */}
                <Line type="monotone" dataKey="migraine_count" stroke="#991b1b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sleep log */}
        <ChartCard title={`Sleep Log (${range}d)`} subtitle="Total sleep hours per day">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, "auto"]} />
                <Tooltip />
                {/* dark blue */}
                <Line type="monotone" dataKey="sleep" stroke="#1e3a8a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Glucose log */}
        <ChartCard title={`Glucose Log (${range}d)`} subtitle="Average mg/dL per day">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, "auto"]} />
                <Tooltip />
                {/* dark purple */}
                <Line type="monotone" dataKey="glucose" stroke="#6b21a8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* (Optional) keep your earlier combined charts & insights below */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={`Glucose ↔ Pain (${range}d)`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" domain={[0, "auto"]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="glucose" stroke="#6b21a8" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="pain" stroke="#991b1b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Insights (beta)" subtitle="Correlation −1..1 (|0.5|≈moderate)">
          <ul className="text-sm space-y-1">
            <li>Glucose vs pain: <b>{fmt(corr.pain_vs_glucose)}</b></li>
            <li>Sleep vs pain: <b>{fmt(corr.pain_vs_sleep)}</b></li>
            <li>Yday glucose → pain: <b>{fmt(corr.pain_vs_glucose_lag1)}</b></li>
            <li>Yday sleep → pain: <b>{fmt(corr.pain_vs_sleep_lag1)}</b></li>
          </ul>
        </ChartCard>

        <ChartCard title={`Sleep ↔ Pain (${range}d)`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" domain={[0, "auto"]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="sleep" stroke="#1e3a8a" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="pain" stroke="#991b1b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function fmt(v) {
  return v === null || Number.isNaN(v) ? "—" : Number(v).toFixed(2);
}