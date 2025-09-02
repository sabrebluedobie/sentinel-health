import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  Legend,
} from "recharts";
import { Activity, BedDouble, Brain, CalendarDays, TrendingUp, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase"; // ← verify this path in your project

/**
 * Sentinel Health — Dashboard
 *
 * Visual-first layout with:
 *  - Three Recharts line charts (Blood Sugar, Sleep, Migraines)
 *  - Three matching tables (latest entries)
 *  - Nightscout connector card + status (non-destructive — keeps your connector flow)
 *
 * ✅ Tailwind-only classes. No CSS frameworks that might restyle your UI.
 * ✅ Error + empty states so the page never looks broken.
 * ✅ "Range" filter (7d/30d/90d/YTD/All).
 *
 * IMPORTANT — Map CONFIG to your real tables/columns to avoid 42P01 errors.
 */

// ────────────────────────────────────────────────────────────────────────────────
// CONFIG — map to your actual Supabase schema
// ────────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  bloodSugar: {
    title: "Blood Sugar",
    icon: Activity,
    table: "blood_glucose", // e.g., blood_glucose
    columns: { timestamp: "measured_at", value: "mg_dl" }, // timestamptz, numeric
    thresholds: { low: 70, high: 180 },
    unit: "mg/dL",
  },
  sleep: {
    title: "Hours of Sleep",
    icon: BedDouble,
    table: "sleep_sessions", // e.g., sleep_sessions
    columns: { timestamp: "slept_on", value: "hours" }, // date, numeric
    target: { min: 7, max: 9 },
    unit: "hrs",
  },
  migraines: {
    title: "Migraine Pain",
    icon: Brain,
    table: "migraines", // e.g., migraines
    columns: { timestamp: "occurred_at", value: "pain" }, // timestamptz, int(0-10)
    scale: [0, 10],
    unit: "/10",
  },
};

const RANGES = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

function startOfRange(rangeKey) {
  const now = new Date();
  const d = new Date(now);
  switch (rangeKey) {
    case "7d": d.setDate(d.getDate() - 7); return d;
    case "30d": d.setDate(d.getDate() - 30); return d;
    case "90d": d.setDate(d.getDate() - 90); return d;
    case "ytd": return new Date(now.getFullYear(), 0, 1);
    case "all":
    default: return null;
  }
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
}

function groupByDay(rows, tsKey, valueKey, reducer = (arr) => arr[arr.length - 1]) {
  const byDay = new Map();
  for (const r of rows) {
    const date = new Date(r[tsKey]);
    const dayKey = isNaN(date) ? String(r[tsKey]) : date.toISOString().slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(Number(r[valueKey]));
  }
  const out = [];
  for (const [day, vals] of byDay.entries()) out.push({ date: day, value: reducer(vals) });
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function fillMissingDays(series) {
  if (!series.length) return series;
  const start = new Date(series[0].date);
  const end = new Date(series[series.length - 1].date);
  const map = new Map(series.map((p) => [p.date, p.value]));
  const out = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, value: map.has(key) ? map.get(key) : null });
  }
  return out;
}

function Summary({ series, unit }) {
  const stats = useMemo(() => {
    const nums = series.map((d) => d.value).filter((v) => typeof v === "number");
    if (!nums.length) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return { avg, min, max };
  }, [series]);

  if (!stats) return <div className="text-sm text-zinc-500 dark:text-zinc-400">No data</div>;

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4"/>Avg: <strong>{stats.avg.toFixed(1)}</strong> {unit}</div>
      <div className="flex items-center gap-1">Min: <strong>{stats.min.toFixed(1)}</strong> {unit}</div>
      <div className="flex items-center gap-1">Max: <strong>{stats.max.toFixed(1)}</strong> {unit}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, Icon, series, unit, yDomain, thresholds, targetBand }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            {Icon ? <Icon className="h-5 w-5"/> : null}
            <span>{title}</span>
          </div>
          {subtitle ? <div className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}
        </div>
        <Summary series={series} unit={unit} />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={series} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d)} minTickGap={24} />
            <YAxis domain={yDomain || ["auto", "auto"]} allowDecimals={true} />
            <Tooltip
              formatter={(value) => [
                typeof value === "number" ? value.toFixed(1) + (unit ? ` ${unit}` : "") : value,
                title,
              ]}
              labelFormatter={(label) => fmtDate(label)}
            />
            {targetBand ? (
              <ReferenceArea y1={targetBand.min} y2={targetBand.max} fillOpacity={0.08} />
            ) : null}
            {thresholds?.low != null && <ReferenceLine y={thresholds.low} strokeDasharray="4 4" />}
            {thresholds?.high != null && <ReferenceLine y={thresholds.high} strokeDasharray="4 4" />}
            <Legend />
            <Line type="monotone" dataKey="value" name={title} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DataTable({ title, columns, rows, emptyText }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 text-base font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-zinc-500 dark:text-zinc-400" colSpan={columns.length}>{emptyText}</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-2 py-2">{r[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NightscoutCard({ connected }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Settings className="h-5 w-5"/>
        Nightscout Settings
      </div>
      <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {connected ? "Nightscout is connected." : "Click \"Nightscout Settings\" to configure your connection."}
      </div>
      <a href="/settings" className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
        Open Settings
      </a>
    </div>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chart series
  const [bloodSugarSeries, setBloodSugarSeries] = useState([]);
  const [sleepSeries, setSleepSeries] = useState([]);
  const [migraineSeries, setMigraineSeries] = useState([]);

  // Table rows (latest N in the selected range)
  const [bloodSugarRows, setBloodSugarRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [migraineRows, setMigraineRows] = useState([]);

  // Nightscout status (placeholder; wire to your real table if desired)
  const [nightscoutConnected] = useState(false);

  const rangeStart = useMemo(() => startOfRange(range), [range]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const gteTS = rangeStart ? rangeStart.toISOString() : null;

        // ── Blood Sugar ────────────────────────────────────────────────────────
        {
          const { table, columns } = CONFIG.bloodSugar;
          let q = supabase.from(table).select(`${columns.timestamp}, ${columns.value}`).order(columns.timestamp, { ascending: true });
          if (gteTS) q = q.gte(columns.timestamp, gteTS);
          const { data, error } = await q;
          if (error) throw new Error(`[Blood sugar] ${error.message}`);

          const rows = (data || []).map((r) => ({
            date: new Date(r[columns.timestamp]).toISOString().slice(0,10),
            value: Number(r[columns.value]),
          }));

          const series = rows
            .map((r) => ({ date: r.date, value: r.value }))
            .sort((a, b) => a.date.localeCompare(b.date));

          if (!cancelled) {
            setBloodSugarSeries(fillMissingDays(series));
            setBloodSugarRows([...rows].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10));
          }
        }

        // ── Sleep (sum per day) ───────────────────────────────────────────────
        {
          const { table, columns } = CONFIG.sleep;
          let q = supabase.from(table).select(`${columns.timestamp}, ${columns.value}`).order(columns.timestamp, { ascending: true });
          if (gteTS) q = q.gte(columns.timestamp, gteTS);
          const { data, error } = await q;
          if (error) throw new Error(`[Sleep] ${error.message}`);

          const byDay = new Map();
          for (const row of data || []) {
            const d = new Date(row[columns.timestamp]);
            const key = isNaN(d) ? String(row[columns.timestamp]) : d.toISOString().slice(0, 10);
            const hrs = Number(row[columns.value]);
            byDay.set(key, (byDay.get(key) || 0) + (isNaN(hrs) ? 0 : hrs));
          }
          const series = Array.from(byDay.entries()).map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));
          const flatRows = (data || []).map((r) => ({
            date: new Date(r[columns.timestamp]).toISOString().slice(0,10),
            value: Number(r[columns.value]),
          }));
          if (!cancelled) {
            setSleepSeries(fillMissingDays(series));
            setSleepRows([...flatRows].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10));
          }
        }

        // ── Migraines (max pain per day) ──────────────────────────────────────
        {
          const { table, columns } = CONFIG.migraines;
          let q = supabase.from(table).select(`${columns.timestamp}, ${columns.value}`).order(columns.timestamp, { ascending: true });
          if (gteTS) q = q.gte(columns.timestamp, gteTS);
          const { data, error } = await q;
          if (error) throw new Error(`[Migraines] ${error.message}`);

          const series = groupByDay(data || [], columns.timestamp, columns.value, (vals) => Math.max(...vals.map(Number)));
          const flatRows = (data || []).map((r) => ({
            date: new Date(r[columns.timestamp]).toISOString().slice(0,10),
            value: Number(r[columns.value]),
          }));
          if (!cancelled) {
            setMigraineSeries(fillMissingDays(series));
            setMigraineRows([...flatRows].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || String(e));
        // Fallback demo data so visuals remain
        if (!cancelled) {
          if (!bloodSugarSeries.length) setBloodSugarSeries(demoSeries(110, 20, 65, 185));
          if (!sleepSeries.length) setSleepSeries(demoSeries(7.2, 10, 2, 10));
          if (!migraineSeries.length) setMigraineSeries(demoSeries(3.0, 10, 0, 10));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Health Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-xl px-3 py-1.5 text-sm ${
                range === r.key
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* Layout: main charts + sidebar for connectors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartCard
              title={CONFIG.bloodSugar.title}
              subtitle="Daily readings"
              Icon={CONFIG.bloodSugar.icon}
              series={bloodSugarSeries}
              unit={CONFIG.bloodSugar.unit}
              yDomain={[40, 260]}
              thresholds={CONFIG.bloodSugar.thresholds}
            />
            <ChartCard
              title={CONFIG.sleep.title}
              subtitle="Sum per day"
              Icon={CONFIG.sleep.icon}
              series={sleepSeries}
              unit={CONFIG.sleep.unit}
              yDomain={[0, 12]}
              targetBand={CONFIG.sleep.target}
            />
            <ChartCard
              title={CONFIG.migraines.title}
              subtitle="Max pain per day"
              Icon={CONFIG.migraines.icon}
              series={migraineSeries}
              unit={CONFIG.migraines.unit}
              yDomain={CONFIG.migraines.scale}
            />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DataTable
              title="Recent Glucose"
              columns={[{ key: "date", label: "Date" }, { key: "value", label: `Value (${CONFIG.bloodSugar.unit})` }]}
              rows={bloodSugarRows}
              emptyText="No glucose entries in range"
            />
            <DataTable
              title="Recent Sleep"
              columns={[{ key: "date", label: "Date" }, { key: "value", label: `Hours (${CONFIG.sleep.unit})` }]}
              rows={sleepRows}
              emptyText="No sleep entries in range"
            />
            <DataTable
              title="Recent Migraines"
              columns={[{ key: "date", label: "Date" }, { key: "value", label: `Pain (${CONFIG.migraines.unit})` }]}
              rows={migraineRows}
              emptyText="No migraine entries in range"
            />
          </div>
        </div>

        {/* Sidebar — keep connectors / Nightscout Pro */}
        <div className="space-y-6">
          <NightscoutCard connected={nightscoutConnected} />
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 text-base font-semibold">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <a href="/glucose" className="rounded-xl border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">📊 Log Glucose</a>
              <a href="/migraine" className="rounded-xl border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">😖 Log Migraine</a>
              <a href="/sleep" className="rounded-xl border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">💤 Log Sleep</a>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
      ) : null}
    </div>
  );
}

// --------- Demo fallback series (used only on error) ---------
function demoSeries(center = 100, days = 14, min = 80, max = 180) {
  const today = new Date();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const variance = (Math.sin(i / 2) + Math.random() * 0.5) * (max - min) * 0.1;
    const val = Math.min(max, Math.max(min, center + (Math.random() - 0.5) * variance));
    out.push({ date: d.toISOString().slice(0, 10), value: Number(val.toFixed(1)) });
  }
  return out;
}
