import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area
} from "recharts";
import MigraineLogModal from "@/components/modals/MigraineLogModal.jsx";
import GlucoseModal from "@/components/modals/GlucoseModal.jsx";
import SleepModal from "@/components/modals/SleepModal.jsx";
import SettingsModal from "@/components/modals/SettingsModal.jsx";

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}
const labelDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });

export default function Dashboard() {
  const [openMigraine, setOpenMigraine] = useState(false);
  const [openGlucose, setOpenGlucose] = useState(false);
  const [openSleep, setOpenSleep] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [latest, setLatest] = useState({ glucose: null, sleep: null, migraine: null });

  const [glucoseRows, setGlucoseRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [migraineRows, setMigraineRows] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true); setMsg("");
      const uid = await getUid();
      if (!uid) { setMsg("Not signed in."); setLoading(false); return; }

      const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
      const since180 = new Date(Date.now() - 180 * 864e5).toISOString();

      try {
        const [{ data: g1 }, { data: s1 }, { data: m1 }] = await Promise.all([
          supabase.from("glucose_readings").select("*").eq("user_id", uid)
            .order("device_time", { ascending: false }).limit(1),
          supabase.from("sleep_data").select("*").eq("user_id", uid)
            .order("start_time", { ascending: false }).limit(1),
          supabase.from("migraine_episodes").select("*").eq("user_id", uid)
            .order("start_time", { ascending: false }).limit(1),
        ]);
        setLatest({ glucose: g1?.[0] || null, sleep: s1?.[0] || null, migraine: m1?.[0] || null });

        const [{ data: gAll }, { data: sAll }, { data: mAll }] = await Promise.all([
          supabase.from("glucose_readings").select("device_time, value_mgdl")
            .eq("user_id", uid).gte("device_time", since7)
            .order("device_time", { ascending: true }),
          supabase.from("sleep_data").select("start_time, end_time, total_sleep_hours")
            .eq("user_id", uid).gte("start_time", since180)
            .order("start_time", { ascending: true }),
          supabase.from("migraine_episodes").select("start_time, end_time, severity")
            .eq("user_id", uid).gte("start_time", since180)
            .order("start_time", { ascending: true }),
        ]);
        setGlucoseRows(Array.isArray(gAll) ? gAll : []);
        setSleepRows(Array.isArray(sAll) ? sAll : []);
        setMigraineRows(Array.isArray(mAll) ? mAll : []);
      } catch (e) {
        setMsg(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // transforms
  const glucoseData = useMemo(() => {
    const map = new Map();
    for (const r of glucoseRows) {
      const d = new Date(r.device_time);
      const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const cur = map.get(k) || { sum: 0, n: 0 };
      const v = Number(r.value_mgdl);
      if (Number.isFinite(v)) { cur.sum += v; cur.n += 1; }
      map.set(k, cur);
    }
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([k,v]) => ({ day: labelDate(k), avg: v.n ? Math.round(v.sum/v.n) : null }));
  }, [glucoseRows]);

  const sleepData = useMemo(() => {
    return sleepRows.map(r => {
      const start = new Date(r.start_time);
      const end = r.end_time ? new Date(r.end_time) : null;
      const hours = end ? Math.max(0, (end - start) / 36e5) : (r.total_sleep_hours ?? null);
      return { day: labelDate(r.start_time), hours: hours ? Number(Number(hours).toFixed(2)) : null };
    });
  }, [sleepRows]);

  const migraineData = useMemo(() => {
    return migraineRows.map(r => ({ day: labelDate(r.start_time), severity: Number(r.severity) || 0 }));
  }, [migraineRows]);

  const faint = "#9ca3af"; // light gray text/axes
  const grid = "#e5e7eb";  // light grid lines

  // save handlers (unchanged behavior)
  async function handleSaveMigraine(payload) {
    const uid = await getUid();
    await supabase.from("migraine_episodes").insert([{ ...payload, user_id: uid }]);
  }
  async function handleSaveGlucose(payload) {
    const uid = await getUid();
    const row = {
      user_id: uid,
      value_mgdl: payload.value_mgdl,
      device_time: payload.time,
      reading_type: payload.reading_type,
      trend: payload.trend,
      source: payload.source,
      note: payload.note
    };
    await supabase.from("glucose_readings").insert([row]);
  }
  async function handleSaveSleep(payload) {
    const uid = await getUid();
    await supabase.from("sleep_data").insert([{ ...payload, user_id: uid }]);
  }

  // stat pills (closer to your original)
  const Stat = ({ label, value, sub, action }) => (
    <div className="card" style={{ display: "grid", gap: 6, padding: 16 }}>
      <div style={{ fontSize: 12, color: faint }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280", minHeight: 16 }}>{sub}</div>
      {action}
    </div>
  );

  return (
    <div>
      <div className="card" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="h1" style={{ margin: 0, textAlign: "left" }}>Dashboard</h1>
        <button className="btn" onClick={() => window.location.reload()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <div style={{ marginLeft: "auto", color: msg ? "#b00020" : "#6b7280" }}>{msg || ""}</div>
      </div>

      {/* Stat pills */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 16 }}>
        <Stat
          label="Glucose"
          value={latest.glucose ? `${latest.glucose.value_mgdl} mg/dL` : "—"}
          sub={latest.glucose ? new Date(latest.glucose.device_time).toLocaleString() : "No entries yet"}
          action={<button className="btn primary" onClick={() => setOpenGlucose(true)}>Log</button>}
        />
        <Stat
          label="Sleep"
          value={latest.sleep ? (latest.sleep.total_sleep_hours ?? "—") + " h" : "—"}
          sub={latest.sleep ? new Date(latest.sleep.start_time).toLocaleString() : "No entries yet"}
          action={<button className="btn primary" onClick={() => setOpenSleep(true)}>Log</button>}
        />
        <Stat
          label="Migraine"
          value={latest.migraine ? `sev ${latest.migraine.severity ?? "—"}` : "—"}
          sub={latest.migraine ? new Date(latest.migraine.start_time).toLocaleString() : "No episodes yet"}
          action={<button className="btn primary" onClick={() => setOpenMigraine(true)}>Log</button>}
        />
        <Stat
          label="Settings"
          value="Nightscout"
          sub="Connection & preferences"
          action={<button className="btn" onClick={() => setOpenSettings(true)}>Open</button>}
        />
      </div>

      {/* Charts (lighter look) */}
      <div style={{ display: "grid", gap: 12 }}>
        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Glucose — 7 day average</h3>
          {!glucoseData.length ? (
            <div style={{ color: "#6b7280", fontSize: 14, padding: "8px 0" }}>No glucose data yet.</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={glucoseData}>
                  <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke={faint} />
                  <YAxis domain={[40, 300]} stroke={faint} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg" name="Avg mg/dL" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Sleep — duration (last 6 months)</h3>
          {!sleepData.length ? (
            <div style={{ color: "#6b7280", fontSize: 14, padding: "8px 0" }}>No sleep data yet.</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={sleepData}>
                  <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke={faint} />
                  <YAxis unit="h" stroke={faint} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" name="Hours slept" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Migraine — severity (last 6 months)</h3>
          {!migraineData.length ? (
            <div style={{ color: "#6b7280", fontSize: 14, padding: "8px 0" }}>No migraine episodes yet.</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={migraineData}>
                  <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke={faint} />
                  <YAxis domain={[0, 10]} stroke={faint} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="severity" name="Severity" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {openGlucose && <GlucoseModal open={openGlucose} onClose={() => setOpenGlucose(false)} onSave={handleSaveGlucose} />}
      {openSleep && <SleepModal open={openSleep} onClose={() => setOpenSleep(false)} onSave={handleSaveSleep} />}
      {openMigraine && <MigraineLogModal open={openMigraine} onClose={() => setOpenMigraine(false)} onSave={handleSaveMigraine} />}
      {openSettings && <SettingsModal open={openSettings} onClose={() => setOpenSettings(false)} />}
    </div>
  );
}
