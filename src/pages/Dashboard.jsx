// src/pages/Dashboard.jsx (reworked)
// Sleek dashboard with Recharts; pulls from Supabase tables:
//   - public.glucose_readings (device_time, value_mgdl, user_id)
//   - public.sleep_data       (start_time, end_time[, efficiency], user_id)
//   - public.migraine_episodes(started_at|created_at, pain[, symptoms], user_id)
// Keeps Nightscout connection CTA. No connectors removed.

import React, { useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase";
import { Link } from "react-router-dom";

// Recharts
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

// --- tiny helpers ------------------------------------------------------------
const dayLabel = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });

const clamp = (n, lo, hi) => (Number.isFinite(+n) ? Math.min(Math.max(+n, lo), hi) : null);

async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// --- Dashboard ---------------------------------------------------------------
export default function Dashboard() {
  const [lookback, setLookback] = useState(30); // 7 | 30 | 90 | 365
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // raw rows
  const [glucoseRows, setGlucoseRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [migraineRows, setMigraineRows] = useState([]);

  // fetch all
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const uid = await getUserId();
        if (!uid) {
          setErrorMsg("Not signed in.");
          setLoading(false);
          return;
        }
        const sinceISO = daysAgoISO(lookback);

        const [g, s, m] = await Promise.all([
          supabase
            .from("glucose_readings")
            .select("device_time,value_mgdl")
            .eq("user_id", uid)
            .gte("device_time", sinceISO)
            .order("device_time", { ascending: true })
            .limit(5000),
          supabase
            .from("sleep_data")
            .select("start_time,end_time,efficiency")
            .eq("user_id", uid)
            .gte("start_time", sinceISO)
            .order("start_time", { ascending: true })
            .limit(1000),
          supabase
            .from("migraine_episodes")
            .select("id,started_at,created_at,pain,symptoms")
            .eq("user_id", uid)
            .gte("created_at", sinceISO) // tolerate schemas that only have created_at
            .order("created_at", { ascending: true })
            .limit(2000),
        ]);

        if (cancelled) return;

        // If migraine_episodes doesn’t exist yet, try the legacy table once
        if (m.error && m.error.code === "42P01") {
          const legacy = await supabase
            .from("migraine_entries")
            .select("id,created_at as started_at,pain,symptoms")
            .eq("user_id", uid)
            .gte("created_at", sinceISO)
            .order("created_at", { ascending: true })
            .limit(2000);
          if (!legacy.error) {
            m.data = legacy.data;
            m.error = null;
          }
        }

        // handle glucose
        if (g.error && g.error.code === "42P01") {
          throw new Error("Table public.glucose_readings not found.");
        }
        setGlucoseRows(g.data || []);

        // handle sleep
        if (s.error && s.error.code === "42P01") {
          throw new Error("Table public.sleep_data not found.");
        }
        setSleepRows(s.data || []);

        // handle migraines
        if (m.error) throw m.error;
        setMigraineRows(m.data || []);
      } catch (e) {
        setErrorMsg(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lookback]);

  // realtime refresh
  useEffect(() => {
    let subs = [];
    (async () => {
      const uid = await getUserId();
      if (!uid) return;
      subs = [
        supabase
          .channel("glucose_feed")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${uid}` },
            () => setLookback((d) => d) // trigger refetch via dep
          )
          .subscribe(),
        supabase
          .channel("sleep_feed")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${uid}` },
            () => setLookback((d) => d)
          )
          .subscribe(),
        supabase
          .channel("migraine_feed")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "migraine_episodes", filter: `user_id=eq.${uid}` },
            () => setLookback((d) => d)
          )
          .subscribe(),
      ];
    })();
    return () => {
      subs.forEach((c) => supabase.removeChannel(c));
    };
  }, []);

  // ---- derived chart data ---------------------------------------------------
  const glucoseSeries = useMemo(() => {
    // daily avg mg/dL
    const byDay = new Map();
    for (const r of glucoseRows) {
      const key = (r.device_time || "").slice(0, 10);
      if (!key) continue;
      const arr = byDay.get(key) || [];
      arr.push(Number(r.value_mgdl));
      byDay.set(key, arr);
    }
    return [...byDay.entries()]
      .map(([date, vals]) => ({ date, mgdl: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [glucoseRows]);

  const sleepSeries = useMemo(() => {
    // total hours slept per day = sum(end_time - start_time)
    const byDay = new Map();
    for (const r of sleepRows) {
      const start = Date.parse(r.start_time);
      const end = Date.parse(r.end_time);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const key = new Date(start).toISOString().slice(0, 10);
      const prev = byDay.get(key) || 0;
      byDay.set(key, prev + (end - start) / 3_600_000);
    }
    return [...byDay.entries()]
      .map(([date, hours]) => ({ date, hours: +hours.toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sleepRows]);

  const migraineSeries = useMemo(() => {
    // pain over time (average per day)
    const byDay = new Map();
    for (const r of migraineRows) {
      const when = r.started_at || r.created_at;
      const key = when ? String(when).slice(0, 10) : null;
      const pain = clamp(r.pain, 0, 10);
      if (!key || pain == null) continue;
      const entry = byDay.get(key) || { total: 0, n: 0 };
      entry.total += pain;
      entry.n += 1;
      byDay.set(key, entry);
    }
    return [...byDay.entries()]
      .map(([date, { total, n }]) => ({ date, pain: +(total / n).toFixed(1) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [migraineRows]);

  // recent tables
  const recentGlucose = useMemo(() => [...glucoseRows].reverse().slice(0, 8), [glucoseRows]);
  const recentSleep = useMemo(() => [...sleepRows].reverse().slice(0, 8), [sleepRows]);
  const recentMigraine = useMemo(() => [...migraineRows].reverse().slice(0, 8), [migraineRows]);

  // ---- UI -------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Health Dashboard</h1>
        <div className="inline-flex rounded-md shadow-sm overflow-hidden border">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setLookback(d)}
              className={`px-3 py-1 text-sm ${
                lookback === d ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
              }`}
            >
              {d === 365 ? "YTD" : `${d}d`}
            </button>
          ))}
        </div>
      </header>

      {!!errorMsg && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-800 p-3">
          {errorMsg}
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blood Sugar */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-semibold">Blood Sugar</h2>
              <p className="text-slate-500 text-sm">Daily avg (mg/dL)</p>
            </div>
            <span className="text-slate-400 text-xs">{glucoseSeries.length} days</span>
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <RLineChart data={glucoseSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={12} />
                <YAxis domain={[0, "dataMax + 40"]} />
                <Tooltip labelFormatter={dayLabel} />
                <Legend />
                <Line type="monotone" dataKey="mgdl" name="Avg mg/dL" strokeWidth={2} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-semibold">Hours of Sleep</h2>
              <p className="text-slate-500 text-sm">Sum per day</p>
            </div>
            <span className="text-slate-400 text-xs">{sleepSeries.length} days</span>
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <BarChart data={sleepSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={12} />
                <YAxis />
                <Tooltip labelFormatter={dayLabel} />
                <Legend />
                <Bar dataKey="hours" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Migraine Pain */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-semibold">Migraine Pain</h2>
              <p className="text-slate-500 text-sm">Average per day (0–10)</p>
            </div>
            <span className="text-slate-400 text-xs">{migraineSeries.length} days</span>
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <AreaChart data={migraineSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={12} />
                <YAxis domain={[0, 10]} />
                <Tooltip labelFormatter={dayLabel} />
                <Legend />
                <Area type="monotone" dataKey="pain" name="Avg pain" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Nightscout CTA + Quick Actions */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-semibold">Nightscout Settings</h3>
              <p className="text-slate-500 text-sm">Configure your CGM connection</p>
            </div>
          </div>
          <Link className="inline-block mt-3 text-blue-600 underline" to="/settings">
            Open Settings
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="px-3 py-2 rounded border hover:bg-slate-50" to="/log/glucose">📊 Log Glucose</Link>
            <Link className="px-3 py-2 rounded border hover:bg-slate-50" to="/log/migraine">🤕 Log Migraine</Link>
            <Link className="px-3 py-2 rounded border hover:bg-slate-50" to="/log/sleep">💤 Log Sleep</Link>
          </div>
        </div>
      </section>

      {/* Recent tables */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold mb-2">Recent Glucose</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Date</th>
                <th className="py-1">Value (mg/dL)</th>
              </tr>
            </thead>
            <tbody>
              {recentGlucose.length === 0 && (
                <tr><td colSpan={2} className="py-2 text-slate-500">No entries</td></tr>
              )}
              {recentGlucose.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{new Date(r.device_time).toLocaleString()}</td>
                  <td className="py-1">{r.value_mgdl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold mb-2">Recent Sleep</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Start</th>
                <th className="py-1">End</th>
                <th className="py-1">Hours</th>
              </tr>
            </thead>
            <tbody>
              {recentSleep.length === 0 && (
                <tr><td colSpan={3} className="py-2 text-slate-500">No entries</td></tr>
              )}
              {recentSleep.map((r, i) => {
                const start = Date.parse(r.start_time);
                const end = Date.parse(r.end_time);
                const hrs = Number.isFinite(start) && Number.isFinite(end) && end > start
                  ? ((end - start) / 3_600_000).toFixed(2)
                  : "—";
                return (
                  <tr key={i} className="border-t">
                    <td className="py-1">{new Date(r.start_time).toLocaleString()}</td>
                    <td className="py-1">{new Date(r.end_time).toLocaleString()}</td>
                    <td className="py-1">{hrs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold mb-2">Recent Migraines</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">When</th>
                <th className="py-1">Pain</th>
                <th className="py-1">Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {recentMigraine.length === 0 && (
                <tr><td colSpan={3} className="py-2 text-slate-500">No entries</td></tr>
              )}
              {recentMigraine.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-1">{new Date(r.started_at || r.created_at).toLocaleString()}</td>
                  <td className="py-1">{r.pain ?? "—"}</td>
                  <td className="py-1">{Array.isArray(r.symptoms) ? r.symptoms.join(", ") : (r.symptoms || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <div className="mt-6 text-slate-500">Loading…</div>
      )}
    </div>
  );
}
