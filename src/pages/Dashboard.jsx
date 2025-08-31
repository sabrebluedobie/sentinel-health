// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area
} from "recharts";

// Helper: user id
async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

// Format date label
function dlabel(d) {
  try { return new Date(d).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }); }
  catch { return ""; }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [latest, setLatest] = useState({ glucose: null, sleep: null, migraine: null });
  const [glucoseRows, setGlucoseRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [migraineRows, setMigraineRows] = useState([]);

  async function load() {
    setLoading(true);
    setMsg("");

    const uid = await getUid();
    if (!uid) {
      setMsg("Not signed in.");
      setLoading(false);
      return;
    }

    const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

    try {
      // Latest rows for the cards
      const [{ data: g1 }, { data: s1 }, { data: m1 }] = await Promise.all([
        supabase.from("glucose_readings").select("*").eq("user_id", uid)
          .order("device_time", { ascending: false }).limit(1),
        supabase.from("sleep_logs").select("*").eq("user_id", uid)
          .order("start_time", { ascending: false }).limit(1),
        supabase.from("migraine_episodes").select("*").eq("user_id", uid)
          .order("start_time", { ascending: false }).limit(1), // if your column is started_at, change here
      ]);

      // Series for charts
      const [{ data: gAll }, { data: sAll }, { data: mAll }] = await Promise.all([
        supabase.from("glucose_readings").select("device_time, value_mgdl")
          .eq("user_id", uid).gte("device_time", since7)
          .order("device_time", { ascending: true }),
        supabase.from("sleep_logs").select("start_time, end_time")
          .eq("user_id", uid).gte("start_time", since30)
          .order("start_time", { ascending: true }),
        supabase.from("migraine_episodes").select("start_time, end_time, severity")
          .eq("user_id", uid).gte("start_time", since30)
          .order("start_time", { ascending: true }),
      ]);

      setLatest({
        glucose: g1?.[0] || null,
        sleep: s1?.[0] || null,
        migraine: m1?.[0] || null,
      });

      setGlucoseRows(Array.isArray(gAll) ? gAll : []);
      setSleepRows(Array.isArray(sAll) ? sAll : []);
      setMigraineRows(Array.isArray(mAll) ? mAll : []);
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Transform for charts
  const glucoseData = useMemo(() => {
    // group by date (show daily avg for last 7 days)
    const map = new Map(); // date -> {sum, n}
    for (const r of glucoseRows) {
      const day = new Date(r.device_time);
      const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
      const cur = map.get(key) || { sum: 0, n: 0 };
      if (Number.isFinite(Number(r.value_mgdl))) {
        cur.sum += Number(r.value_mgdl);
        cur.n += 1;
      }
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ day: dlabel(k), avg: v.n ? Math.round(v.sum / v.n) : null }));
  }, [glucoseRows]);

  const sleepData = useMemo(() => {
    // duration hours per day (last 30 days)
    return sleepRows.map(r => {
      const start = new Date(r.start_time);
      const end = r.end_time ? new Date(r.end_time) : null;
      const hours = end ? Math.max(0, (end - start) / 36e5) : null;
      return { day: dlabel(r.start_time), hours: hours ? Number(hours.toFixed(2)) : null };
    });
  }, [sleepRows]);

  const migraineData = useMemo(() => {
    // severity over time (last 30 days)
    return migraineRows.map(r => ({
      day: dlabel(r.start_time), // if you use started_at, change field here
      severity: Number(r.severity) || 0,
    }));
  }, [migraineRows]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Dashboard</h1>
        <button onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        <span style={{ marginLeft: "auto", color: msg ? "#b00020" : "#4a4a4a" }}>{msg || ""}</span>
      </header>

      {/* Action cards */}
      <section
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginBottom: 28
        }}
      >
        {/* Glucose */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Glucose</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.glucose
              ? `Last: ${latest.glucose.value_mgdl} mg/dL • ${new Date(latest.glucose.device_time).toLocaleString()}`
              : loading ? "Loading…" : "No entries yet"}
          </p>
          <Link to="/log-glucose" className="btn">Open</Link>
        </div>

        {/* Sleep */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Sleep</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.sleep
              ? `Last: ${new Date(latest.sleep.start_time).toLocaleString()}`
              : loading ? "Loading…" : "No entries yet"}
          </p>
          <Link to="/log-sleep" className="btn">Open</Link>
        </div>

        {/* Migraine */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Migraine</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.migraine
              ? `Last: ${new Date(latest.migraine.start_time).toLocaleString()} • sev ${latest.migraine.severity ?? "—"}`
              : loading ? "Loading…" : "No episodes yet"}
          </p>
          <Link to="/log-migraine" className="btn">Open</Link>
        </div>

        {/* Settings */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Settings</h3>
          <p style={{ color: "#666", minHeight: 24 }}>Nightscout connection & manual sync</p>
          <Link to="/settings" className="btn">Open</Link>
        </div>
      </section>

      {/* Charts */}
      <section style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr", marginBottom: 32 }}>
        {/* Glucose avg (7d) */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ margin: "4px 0 12px" }}>Glucose — 7 day average</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={glucoseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[40, 300]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Avg mg/dL" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep duration (30d) */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ margin: "4px 0 12px" }}>Sleep — duration (last 30 days)</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis unit="h" />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" name="Hours slept" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Migraine severity (30d) */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ margin: "4px 0 12px" }}>Migraine — severity timeline (last 30 days)</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={migraineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="severity" name="Severity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  );
}
