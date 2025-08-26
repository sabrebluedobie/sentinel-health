// src/pages/Dashboard.jsx
// Sentinel Dashboard — version: 2025-08-22-header-two-rows

import React, { useEffect, useMemo, useState } from "react";
import "./../styles/dashboard.css";

import ToastProvider from "../components/common/ToastProvider.jsx";
import { Panel } from "../components/common/Cards.jsx";
import LineChart from "@/components/charts/LineChart.jsx";
import PieChart from "@/components/charts/PieChart.jsx";
import PieColorsEditor from "@/components/charts/PieColorsEditor"


import MigraineModal from "../components/modals/MigraineModal.jsx";
import GlucoseModal from "../components/modals/GlucoseModal.jsx";
import SleepModal from "../components/modals/SleepModal.jsx";
import SettingsModal from "../components/modals/SettingsModal.jsx";
import EducationModal from "../components/modals/EducationModal.jsx";

import supabase from "../lib/supabase.js";
import { listMigraines } from "../services/migraines.js";
import { listGlucose } from "../services/glucose.js";
import { listSleep } from "../services/sleep.js";
import { getDisclaimerConsent, upsertDisclaimerConsent } from "../services/consents.js";

import { getCurrentPalette, getChartLineColor, getPieSymptomColorMap } from "../lib/brand.js";
import { daysBack, fmt, countByDate, avgByDate, sumSleepHoursByDate } from "../lib/helpers.js";

const [pieColors, setPieColors] = useState([]);
const MIGRAINE_RED = "#b91c1c";
const SLEEP_BLUE = "#1e40af";
const GLUCOSE_PURPLE = "#6c28d9";
// --- thresholds + helpers ---
const STATUS = { LOW: "low", NORMAL: "normal", ELEVATED: "elevated" };
const STATUS_COLOR = {
  [STATUS.LOW]: "#2563eb",       // blue
  [STATUS.NORMAL]: "#16a34a",    // green
  [STATUS.ELEVATED]: "#dc2626",  // red
};
// tweak as needed
const THRESHOLDS = {
  migraine30(total) {
    if (total >= 8) return STATUS.ELEVATED; // 8+ episodes in 30d
    if (total <= 1) return STATUS.LOW;      // 0–1 = low
    return STATUS.NORMAL;
  },
  glucoseAvg(avgMgdl) {
    if (avgMgdl > 180) return STATUS.ELEVATED;
    if (avgMgdl < 70)  return STATUS.LOW;
    return STATUS.NORMAL;
  },
  sleepAvg(avgHours) {
    if (avgHours > 9) return STATUS.ELEVATED; // oversleep flagged as elevated
    if (avgHours < 7) return STATUS.LOW;      // <7h low
    return STATUS.NORMAL;
  },
};
function pillBg(status){ return STATUS_COLOR[status] || "#6b7280"; }
function openChart(kind){
  const el = document.getElementById(`chart-${kind}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent("open-lightbox", { detail: { kind } }));
}
function StatPill({ title, value, suffix, status, onClick }){
  const bg = pillBg(status);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${title} • ${status}`}
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:12, padding:"12px 14px", borderRadius:12, border:"1px solid rgba(0,0,0,.06)",
        background:bg, color:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.08)",
        transition:"transform .08s ease, box-shadow .08s ease",
        cursor:"pointer"
      }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.18)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,.08)"}
    >
      <div style={{fontWeight:700}}>{title}</div>
      <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace"}}>
        {value}{suffix ? ` ${suffix}` : ""}
      </div>
    </button>
  );
}

// Small helper for greeting
function getFirstName(user) {
  if (!user) return "";
  const meta = user.user_metadata || {};
  if (meta.first_name) return String(meta.first_name);
  if (meta.full_name) return String(meta.full_name).split(" ")[0];
  if (user.email) return String(user.email).split("@")[0];
  return "";
}

export default function Dashboard() {
  // ---- auth ----
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription?.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  };

  // ---- data ----
  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

  // ---- ui state ----
  const [openMigraine, setOpenMigraine] = useState(false);
  const [openGlucose, setOpenGlucose] = useState(false);
  const [openSleep, setOpenSleep] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);

  // ---- disclaimer via user_consents ----
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const consent = await getDisclaimerConsent(user.id);
      setShowDisclaimer(!consent);
    })();
  }, [user?.id]);

  async function acceptDisclaimer() {
    if (!user?.id) return;
    await upsertDisclaimerConsent(user.id);
    setShowDisclaimer(false);
  }

  // ---- fetch data when user changes ----
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [m, g, s] = await Promise.all([
        listMigraines(user.id),
        listGlucose(user.id),
        listSleep(user.id),
      ]);
      setEpisodes(m || []);
      setGlucose(g || []);
      setSleep(s || []);
    })();
  }, [user?.id]);

  // ---- computed series for charts ----
  const migraine30 = useMemo(() => {
    const map = countByDate(episodes, "date");
    const labels = daysBack(30).map(fmt);
    return { labels, values: labels.map((l) => map[l] || 0) };
  }, [episodes]);

  const glucose14 = useMemo(() => {
    const avg = avgByDate(glucose, "device_time", "value_mgdl");
    const labels = daysBack(14).map(fmt);
    return { labels, values: labels.map((l) => avg[l] ?? null) };
  }, [glucose]);

  const sleep14 = useMemo(() => {
    const sum = sumSleepHoursByDate(sleep);
    const labels = daysBack(14).map(fmt);
    return { labels, values: labels.map((l) => sum[l] || 0) };
  }, [sleep]);

  const symptomPie = useMemo(() => {
    const counts = {};
    episodes.forEach((ep) => (ep.symptoms || []).forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
  }, [episodes]);

  // ---- settings -> colors for charts ----
  const [settingsTick, setSettingsTick] = useState(0);
  useEffect(() => {
    const fn = () => setSettingsTick((t) => t + 1);
    window.addEventListener("settings-updated", fn);
    return () => window.removeEventListener("settings-updated", fn);
  }, []);
  const palette = useMemo(() => getCurrentPalette(), [settingsTick]);
  const colorMigraine = useMemo(() => getChartLineColor("app.color.line.migraine", "#dc2626"), [settingsTick]);
  const colorGlucose = useMemo(() => getChartLineColor("app.color.line.glucose", "#2563eb"), [settingsTick]);
  const colorSleep = useMemo(() => getChartLineColor("app.color.line.sleep", "#16a34a"), [settingsTick]);
  const pieColors = useMemo(() => {
    const map = getPieSymptomColorMap();
    return symptomPie.labels.map((lbl, i) => map[lbl] || palette[i % palette.length]);
  }, [symptomPie.labels, palette, settingsTick]);

  // Averages for pill display
  const avgGlucose14 = useMemo(() => {
    const vals = glucose14.values.filter(v => v != null);
    return vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
  }, [glucose14.values]);

  const avgSleep14 = useMemo(() => {
    const vals = sleep14.values;
    return vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
  }, [sleep14.values]);

  // Statuses
  const statusMigraine = THRESHOLDS.migraine30(episodes.length || 0);
  const statusGlucose  = THRESHOLDS.glucoseAvg(avgGlucose14);
  const statusSleep    = THRESHOLDS.sleepAvg(avgSleep14);

  // ---- guards ----
  if (!authChecked) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <div style={{ padding: 16 }}>Please sign in to view your dashboard.</div>;

  const firstName = getFirstName(user);

  return (
    <ToastProvider>
      <div className="main">
        {/* ===== Header: Row 1 (title + welcome + settings/logout) ===== */}
        <header
          className="header safe-pad"
          style={{
            padding: "10px 12px",
            background: "var(--brand,#042d4d)",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Left: title + welcome */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <a
                href="https://sentinel-health.webflow.io"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Sentinel Health website"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "inherit", textDecoration: "none" }}
              >
                <img src="/icon-32.png" alt="Sentinel" width={22} height={22} style={{ borderRadius: 6 }} />
                <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Sentinel – Dashboard</div>
              </a>
              <div style={{ opacity: 0.85 }}>|</div>
              <div style={{ whiteSpace: "nowrap" }}>Welcome{firstName ? `, ${firstName}` : ""}</div>
            </div>

            {/* Right: Settings + Logout */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                onClick={() => setOpenSettings(true)}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,.14)",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 6,
                  color: "#fff",
                }}
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,.14)",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 6,
                  color: "#fff",
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* ===== Header: Row 2 (action buttons) ===== */}
          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              gap: 8,
            }}
          >
            <button
              onClick={() => setOpenEducation(true)}
              style={{
                background: "#f59e0b", color: "#111827", padding: "10px 12px",
                borderRadius: 10, fontWeight: 600,
              }}
            >
              Education
            </button>
            <button
              onClick={() => setOpenMigraine(true)}
              style={{
                background: "#063b63", color: "#fff", padding: "10px 12px",
                borderRadius: 10, fontWeight: 600,
              }}
            >
              Migraine
            </button>
            <button
              onClick={() => setOpenGlucose(true)}
              style={{
                background: "#7c3aed", color: "#fff", padding: "10px 12px",
                borderRadius: 10, fontWeight: 600,
              }}
            >
              Blood Sugar
            </button>
            <button
              onClick={() => setOpenSleep(true)}
              style={{
                background: "#2563eb", color: "#fff", padding: "10px 12px",
                borderRadius: 10, fontWeight: 600,
              }}
            >
              Sleep
            </button>
          </div>

          {/* Mobile tightening */}
          <style>{`
            @media (max-width: 640px) {
              header.header .actions-compact { gap: 6px; }
              header.header button { padding: 8px 10px !important; }
              header.header .action-row { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
            }
          `}</style>
        </header>

        {/* Disclaimer */}
        {showDisclaimer && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1100 }}>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16 }}>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, maxWidth: 560 }}>
                <h3>Medical Disclaimer</h3>
                <p style={{ fontSize: 14, color: "#374151" }}>
                  Sentinel Health is a personal tracking tool and does not replace professional medical advice, diagnosis, or treatment.
                  Always consult your physician about your condition or treatment.
                </p>
                <button onClick={acceptDisclaimer} style={{ marginTop: 8, width: "100%", background: "#042d4d", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Main content ===== */}
        <main style={{ padding: "16px 12px" }}>
          {/* Colored, clickable stat pills */}
          <div className="grid grid-3">
            <StatPill
              title="Total Episodes"
              value={episodes.length || 0}
              status={statusMigraine}
              onClick={()=>openChart("migraine")}
            />
            <StatPill
              title="Avg Glucose (14d)"
              value={avgGlucose14.toFixed(1)}
              suffix="mg/dL"
              status={statusGlucose}
              onClick={()=>openChart("glucose")}
            />
            <StatPill
              title="Avg Sleep (14d)"
              value={avgSleep14.toFixed(1)}
              suffix="hrs"
              status={statusSleep}
              onClick={()=>openChart("sleep")}
            />
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div id="chart-migraine">
                <Panel title="Migraine Frequency (30d)" accentColor="#dc2626">
                  <LineChart labels={migraine30.labels} data={migraine30.values} color={colorMigraine} className="h-[280px]" />
                </Panel>
              </div>
              <Panel title="Top Symptoms" accentColor="#7c3aed">
                <PieChart labels={symptomPie.labels} data={symptomPie.values} colors={pieColors} className="h-[280px]" />
              </Panel>
            </div>

            <div className="grid grid-2">
              <div id="chart-glucose">
                <Panel title="Avg Glucose (14d)" accentColor="#2563eb">
                  <LineChart labels={glucose14.labels} data={glucose14.values} color={colorGlucose} className="h-[280px]" />
                </Panel>
              </div>
              <div id="chart-sleep">
                <Panel title="Sleep Hours (14d)" accentColor="#16a34a">
                  <LineChart labels={sleep14.labels} data={sleep14.values} color={colorSleep} className="h-[280px]" />
                </Panel>
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        {openMigraine && <MigraineModal onClose={() => setOpenMigraine(false)} user={user} />}
        {openGlucose && <GlucoseModal onClose={() => setOpenGlucose(false)} user={user} />}
        {openSleep && <SleepModal onClose={() => setOpenSleep(false)} user={user} />}
        {openSettings && <SettingsModal onClose={() => setOpenSettings(false)} />}
        {openEducation && <EducationModal onClose={() => setOpenEducation(false)} />}
      </div>
    </ToastProvider>
  );
}