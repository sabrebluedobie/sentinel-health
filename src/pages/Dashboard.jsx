// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

// Small helper: always resolve the current user's id
async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [latest, setLatest] = useState({
    glucose: null,
    sleep: null,
    migraine: null,
  });

  async function load() {
    setLoading(true);
    setMsg("");

    const uid = await getUid();
    if (!uid) {
      setMsg("Not signed in.");
      setLoading(false);
      return;
    }

    try {
      // Load each “latest” row; keep going even if one fails (RLS or empty table)
      const [{ data: g, error: ge }] = await Promise.all([
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("user_id", uid)
          .order("device_time", { ascending: false })
          .limit(1),
      ]).catch(() => [{ data: null, error: null }]);

      const [{ data: s, error: se }] = await Promise.all([
        supabase
          .from("sleep_logs")
          .select("*")
          .eq("user_id", uid)
          .order("start_time", { ascending: false })
          .limit(1),
      ]).catch(() => [{ data: null, error: null }]);

      const [{ data: m, error: me }] = await Promise.all([
        supabase
          .from("migraine_episodes")
          .select("*")
          .eq("user_id", uid)
          .order("start_time", { ascending: false }) // <- if your columns are started_at/ended_at, change here.
          .limit(1),
      ]).catch(() => [{ data: null, error: null }]);

      // Basic RLS/error surfacing (non-fatal)
      const errs = [ge, se, me].filter(Boolean);
      if (errs.length) {
        setMsg(`Some data could not be loaded (${errs.length}). Check RLS policies.`);
      }

      setLatest({
        glucose: g?.[0] || null,
        sleep: s?.[0] || null,
        migraine: m?.[0] || null,
      });
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Dashboard</h1>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <span style={{ marginLeft: "auto", color: msg ? "#b00020" : "#4a4a4a" }}>
          {msg || ""}
        </span>
      </header>

      <section
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {/* Glucose card */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Glucose</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.glucose
              ? `Last: ${latest.glucose.value_mgdl} mg/dL • ${new Date(
                  latest.glucose.device_time
                ).toLocaleString()}`
              : loading
              ? "Loading…"
              : "No entries yet"}
          </p>
          <Link to="/log-glucose" className="btn">
            Open
          </Link>
        </div>

        {/* Sleep card */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Sleep</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.sleep
              ? `Last: ${new Date(latest.sleep.start_time).toLocaleString()}`
              : loading
              ? "Loading…"
              : "No entries yet"}
          </p>
          <Link to="/log-sleep" className="btn">
            Open
          </Link>
        </div>

        {/* Migraine card */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Log Migraine</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            {latest.migraine
              ? `Last: ${new Date(latest.migraine.start_time).toLocaleString()} • sev ${
                  latest.migraine.severity ?? "—"
                }`
              : loading
              ? "Loading…"
              : "No episodes yet"}
          </p>
          <Link to="/log-migraine" className="btn">
            Open
          </Link>
        </div>

        {/* Settings card */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Settings</h3>
          <p style={{ color: "#666", minHeight: 24 }}>
            Nightscout connection & manual sync
          </p>
          <Link to="/settings" className="btn">
            Open
          </Link>
        </div>
      </section>
    </main>
  );
}
