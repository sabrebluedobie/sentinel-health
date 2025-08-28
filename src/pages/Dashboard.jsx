import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../components/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "@/styles/theme.css";
import "@/styles/dashboard.css"
import logo from "../assets/logo.png";
import LineTile from "@/components/charts/LineTile";
import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import DashboardSection from "@/components/charts/DashboardSection";
import PieColorsEditor from "@/components/charts/PieColorsEditor";
// Tiny inline sparkline chart
function Spark({ data = [], height = 64, thick = false }) {
  if (!data.length) return <div style={s.placeholder}>No data yet</div>;
  const w = 300, h = height, pad = 6;
  const min = Math.min(...data), max = Math.max(...data), span = Math.max(1, max - min);
  const normY = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${pad + i * stepX},${normY(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block" }}>
      <polyline fill="none" stroke="currentColor" strokeWidth={thick ? 2.5 : 1.5} points={pts} />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();

  // Demo arrays; swap with real queries to your Supabase store when ready.
  const [glucoseSeries, setGlucoseSeries] = useState([110, 125, 118, 140, 132, 128, 122]);
  const [sleepSeries, setSleepSeries] = useState([360, 420, 415, 435, 390, 445, 430]); // minutes/night
  const [migraineDays, setMigraineDays] = useState([0, 1, 0, 0, 1, 0, 0]); // count/day for last 7

  const lastGlucose = glucoseSeries.at(-1) ?? null;
  const lastSleepMin = sleepSeries.at(-1) ?? null;
  const lastSleepH = lastSleepMin != null ? `${Math.floor(lastSleepMin/60)}h ${lastSleepMin%60}m` : "—";
  const migraines30d = useMemo(() => migraineDays.reduce((a,b)=>a+b,0), [migraineDays]);

  // Example: add one fake point to make UI feel alive
  const addSample = () => {
    const g = Math.max(60, Math.min(240, (glucoseSeries.at(-1) ?? 120) + (Math.random() > 0.5 ? 8 : -6)));
    setGlucoseSeries([...glucoseSeries.slice(-11), g]);
    const s = Math.max(300, Math.min(540, (sleepSeries.at(-1) ?? 420) + (Math.random() > 0.5 ? 10 : -12)));
    setSleepSeries([...sleepSeries.slice(-11), s]);
    const m = Math.random() > 0.8 ? 1 : 0;
    setMigraineDays([...migraineDays.slice(-11), m]);
  };

  const exportCsv = () => {
    if (!user) return nav("/signin");
    window.open(`/api/export/health-provider?user_id=${encodeURIComponent(user.id)}`, "_blank");
  };

  return (
    <div style={s.wrap}>
      <section style={s.section}>
        <h1 style={s.h1}>Dashboard</h1>
        <p style={s.sub}>Track your **sleep**, **blood glucose**, and **migraine log** in one place.</p>
        <div style={s.actions}>
          <Link to="/log/glucose" style={s.primary}>Log Glucose</Link>
          <Link to="/log/sleep" style={s.secondary}>Log Sleep</Link>
          <Link to="/log/migraine" style={s.secondary}>Log Migraine</Link>
          <button style={s.ghost} onClick={addSample}>Add sample point</button>
          <button style={s.secondary} onClick={exportCsv}>Export to Provider (CSV)</button>
        </div>
      </section>

      <section style={s.cards}>
        <Card title="Latest Glucose" value={lastGlucose != null ? `${lastGlucose} mg/dL` : "—"} hint="Last 7 readings (demo)">
          <Spark data={glucoseSeries} height={56} />
        </Card>

        <Card title="Sleep (last night)" value={lastSleepH} hint="Minutes per night (demo)">
          <Spark data={sleepSeries} height={56} />
        </Card>

        <Card title="Migraine Days (7d)" value={`${migraineDays.reduce((a,b)=>a+b,0)}`} hint="Count of days with migraine (demo)">
          <Spark data={migraineDays} height={56} />
        </Card>
      </section>

      <section style={s.grid}>
        <Panel title="Glucose trend">
          <Spark data={glucoseSeries} height={120} thick />
        </Panel>
        <Panel title="Sleep duration">
          <Spark data={sleepSeries} height={120} thick />
        </Panel>
      </section>
    </div>
  );
}

function Card({ title, value, hint, children }) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <div style={s.cardTitle}>{title}</div>
        <div style={s.cardValue}>{value}</div>
        <div style={s.cardHint}>{hint}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={s.panel}>
      <div style={s.panelTitle}>{title}</div>
      {children}
    </div>
  );
}

const s = {
  wrap: { maxWidth: 1100, margin: "24px auto", padding: "0 16px" },
  section: { marginBottom: 16 },
  h1: { margin: 0, fontSize: 28 },
  sub: { margin: "6px 0 12px", color: "#555" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primary: { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--primary, #1a73e8)", background: "var(--primary, #1a73e8)", color: "#fff", cursor: "pointer", textDecoration: "none" },
  secondary: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer", textDecoration: "none", color: "inherit" },
  ghost: { padding: "10px 12px", borderRadius: 10, border: "1px dashed #ccc", background: "#fafafa", cursor: "pointer" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 },
  card: { border: "1px solid #eee", background: "#fff", borderRadius: 14, padding: 14 },
  cardHead: { marginBottom: 10 },
  cardTitle: { fontSize: 14, color: "#666" },
  cardValue: { fontSize: 22, fontWeight: 700, marginTop: 2 },
  cardHint: { fontSize: 12, color: "#888", marginTop: 2 },
  panel: { border: "1px solid #eee", background: "#fff", borderRadius: 14, padding: 14, minHeight: 120 },
  panelTitle: { fontWeight: 600, marginBottom: 8 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 },
  placeholder: { fontSize: 12, color: "#888" }
};
