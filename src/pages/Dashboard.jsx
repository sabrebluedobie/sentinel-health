import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area
} from "recharts";

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}
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
      const [{ data: g1 }, { data: s1 }, { data: m1 }] = await Promise.all([
        supabase.from("glucose_readings").select("*").eq("user_id", uid)
          .order("device_time", { ascending: false }).limit(1),
        supabase.from("sleep_data").select("*").eq("user_id", uid)
          .order("start_time", { ascending: false }).limit(1),
        supabase.from("migraine_episodes").select("*").eq("user_id", uid)
          .order("start_time", { ascending: false }).limit(1),
      ]);

      const [{ data: gAll }, { data: sAll }, { data: mAll }] = await Promise.all([
        supabase.from("glucose_readings").select("device_time, value_mgdl")
          .eq("user_id", uid).gte("device_time", since7)
          .order("device_time", { ascending: true }),
        supabase.from("sleep_data").select("start_time, end_time, total_sleep_hours")
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

  const glucoseData = useMemo(() => {
    const map = new Map();
    for (const r of glucoseRows) {
      const day = new Date(r.device_time);
      const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
      const cur = map.get(key) || { sum: 0, n: 0 };
      const v = Number(r.value_mgdl);
      if (Number.isFinite(v)) { cur.sum += v; cur.n += 1; }
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ day: dlabel(k), avg: v.n ? Math.round(v.sum / v.n) : null }));
  }, [glucoseRows]);

  const sleepData = useMemo(() => {
    return sleepRows.map(r => {
      const start = new Date(r.start_time);
      const end = r.end_time ? new Date(r.end_time) : null;
      const hours = end ? Math.max(0, (end - start) / 36e5) : (r.total_sleep_hours ?? null);
      return { day: dlabel(r.start_time), hours: hours ? Number(Number(hours).toFixed(2)) : null };
    });
  }, [sleepRows]);

  const migraineData = useMemo(() => {
    return migraineRows.map(r => ({
      day: dlabel(r.start_time),
      severity: Number(r.severity) || 0,
    }));
  }, [migraineRows]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="h1" style={{ margin: 0, textAlign: "left" }}>Dashboard</h1>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <div style={{ marginLeft: "auto", color: msg ? "#b00020" : "#4a4a4a" }}>{msg || ""}</div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 16 }}>
        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Glucose</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.glucose
              ? `Last: ${latest.glucose.value_mgdl} mg/dL • ${new Date(latest.glucose.device_time).toLocaleString()}`
              : loading ? "Loading…" : "No entries yet"}
          </p>
          <Link to="/log-glucose" className="btn primary">Open</Link>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Sleep</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.sleep
              ? `Last: ${new Date(latest.sleep.start_time).toLocaleString()}`
              : loading ? "Loading…" : "No entries yet"}
          </p>
          <Link to="/log-sleep" className="btn primary">Open</Link>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Migraine</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.migraine
              ? `Last: ${new Date(latest.migraine.start_time).toLocaleString()} • sev ${latest.migraine.severity ?? "—"}`
              : loading ? "Loading…" : "No episodes yet"}
          </p>
          <Link to="/log-migraine" className="btn primary">Open</Link>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Settings</h3>
          <p style={{ color: "#666", minHeight: 24 }}>Nightscout connection & manual sync</p>
          <Link to="/settings" className="btn">Open</Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Glucose — 7 day average</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={glucoseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis domain={[40, 300]} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="avg" name="Avg mg/dL" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Sleep — duration (last 30 days)</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis unit="h" />
                <Tooltip /><Legend />
                <Bar dataKey="hours" name="Hours slept" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Migraine — severity (last 30 days)</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={migraineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis domain={[0, 10]} />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="severity" name="Severity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
