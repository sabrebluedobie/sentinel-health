// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import MigraineLogModal from "../components/modals/MigraineLogModal.jsx";
import GlucoseModal from "../components/modals/GlucoseModal.jsx";
import SleepModal from "../components/modals/SleepModal.jsx";
import SettingsModal from "../components/modals/SettingsModal.jsx";

import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, AreaChart, Area
} from "recharts";


// (charts omitted for brevity; keep your recharts code if you had it)

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function Dashboard() {
  // ✅ DEFINE THESE STATES (fixes "openMigraine is not defined")
  const [openMigraine, setOpenMigraine] = useState(false);
  const [openGlucose,  setOpenGlucose]  = useState(false);
  const [openSleep,    setOpenSleep]    = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [latest, setLatest] = useState({ glucose: null, sleep: null, migraine: null });

  useEffect(() => { (async () => {
    setLoading(true); setMsg("");
    const uid = await getUid();
    if (!uid) { setMsg("Not signed in."); setLoading(false); return; }
    try {
      const [{ data: g1 }, { data: s1 }, { data: m1 }] = await Promise.all([
        supabase.from("glucose_readings").select("*").eq("user_id", uid).order("device_time", { ascending: false }).limit(1),
        supabase.from("sleep_data").select("*").eq("user_id", uid).order("start_time", { ascending: false }).limit(1),
        supabase.from("migraine_episodes").select("*").eq("user_id", uid).order("start_time", { ascending: false }).limit(1),
      ]);
      setLatest({ glucose: g1?.[0] || null, sleep: s1?.[0] || null, migraine: m1?.[0] || null });
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  })(); }, []);

  // Example save handlers (no-ops if you already have them elsewhere)
  async function handleSaveMigraine(payload) {
    const uid = await getUid();
    await supabase.from("migraine_episodes").insert([{ ...payload, user_id: uid }]);
  }
  async function handleSaveGlucose(payload) {
    const uid = await getUid();
    // map payload.time -> device_time if your table uses that
    const row = { user_id: uid, value_mgdl: payload.value_mgdl, device_time: payload.time, reading_type: payload.reading_type, trend: payload.trend, source: payload.source, note: payload.note };
    await supabase.from("glucose_readings").insert([row]);
  }
  async function handleSaveSleep(payload) {
    const uid = await getUid();
    await supabase.from("sleep_data").insert([{ ...payload, user_id: uid }]);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="h1" style={{ margin: 0, textAlign: "left" }}>Dashboard</h1>
        <button className="btn" onClick={() => window.location.reload()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <div style={{ marginLeft: "auto", color: msg ? "#b00020" : "#4a4a4a" }}>{msg || ""}</div>
      </div>

      {/* Action tiles */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 16 }}>
        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Glucose</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.glucose ? `Last: ${latest.glucose.value_mgdl} mg/dL • ${new Date(latest.glucose.device_time).toLocaleString()}`
                             : loading ? "Loading…" : "No entries yet"}
          </p>
          <button className="btn primary" onClick={() => setOpenGlucose(true)}>Open</button>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Sleep</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.sleep ? `Last: ${new Date(latest.sleep.start_time).toLocaleString()}`
                          : loading ? "Loading…" : "No entries yet"}
          </p>
          <button className="btn primary" onClick={() => setOpenSleep(true)}>Open</button>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Log Migraine</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.migraine ? `Last: ${new Date(latest.migraine.start_time).toLocaleString()} • sev ${latest.migraine.severity ?? "—"}`
                              : loading ? "Loading…" : "No episodes yet"}
          </p>
          <button className="btn primary" onClick={() => setOpenMigraine(true)}>Open</button>
        </div>

        <div className="card">
          <h3 className="h1" style={{ textAlign: "left" }}>Settings</h3>
          <p style={{ color: "#666", minHeight: 24 }}>Nightscout connection & preferences</p>
          <button className="btn" onClick={() => setOpenSettings(true)}>Open</button>
        </div>
      </div>

      {/* Modals — render only when open */}
      {openGlucose && (
        <GlucoseModal
          open={openGlucose}
          onClose={() => setOpenGlucose(false)}
          onSave={handleSaveGlucose}
        />
      )}

      {openSleep && (
        <SleepModal
          open={openSleep}
          onClose={() => setOpenSleep(false)}
          onSave={handleSaveSleep}
        />
      )}

      {openMigraine && (
        <MigraineLogModal
          open={openMigraine}
          onClose={() => setOpenMigraine(false)}
          onSave={handleSaveMigraine}
        />
      )}

      {openSettings && (
        <SettingsModal
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        />
      )}
    </div>
  );
}
