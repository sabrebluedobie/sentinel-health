// src/pages/Dashboard.jsx
// Sentinel Dashboard — version: 2025-08-22-header-two-rows

import React, { useEffect, useMemo, useState } from "react";
import "./../styles/dashboard.css";
// If you added these earlier, keep them; they help the blue background + legibility.
// import "./../styles/theme.css";
// import "./../styles/legacy-look.css";

import ToastProvider from "../components/common/ToastProvider.jsx";
import { Panel, StatCard } from "../components/common/Cards.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

// ⬇⬇ NEW: Tailwind-based migraine modal
import MigraineLogModal from "../components/modals/MigraineLogModal.jsx";

// (Old) Modal imports — keep others
// import MigraineModal from "../components/modals/MigraineModal.jsx";
import GlucoseModal from "../components/modals/GlucoseModal.jsx";
import SleepModal from "../components/modals/SleepModal.jsx";
import SettingsModal from "../components/modals/SettingsModal.jsx";
import EducationModal from "../components/modals/EducationModal.jsx";

import supabase from '@/lib/supabase';
import { listMigraines } from "../services/migraines.js";
import { listGlucose } from "../services/glucose.js";
import { listSleep } from "../services/sleep.js";
import { getDisclaimerConsent, upsertDisclaimerConsent } from "../services/consents.js";

import { getCurrentPalette, getChartLineColor, getPieSymptomColorMap } from "../lib/brand.js";
import { daysBack, fmt, countByDate, avgByDate, sumSleepHoursByDate } from "../lib/helpers.js";

// NEW: your logo for the website button
import logo from "../assets/logo.png";

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

  // ---- save from new modal ----
  const handleSaveMigraine = async (payload) => {
    // payload shape from MigraineLogModal:
    // { dateTime, pain, duration, location, symptoms, triggers, medication, effective, weather, barometricPressure, place, notes }
    try {
      if (!user?.id) return;

      const insertPayload = {
        user_id: user.id,
        // normalize date to YYYY-MM-DD for charts that use 'date'
        date: payload?.dateTime ? new Date(payload.dateTime).toISOString().slice(0, 10) : null,
        date_time: payload?.dateTime ?? null,
        pain: payload?.pain ?? null,
        duration_hours: payload?.duration ?? null,
        location: payload?.location ?? null,
        symptoms: payload?.symptoms ?? [],
        triggers: payload?.triggers ?? [],
        medication: payload?.medication ?? null,
        effective: payload?.effective ?? null,
        weather: payload?.weather ?? null,
        barometric_pressure: payload?.barometricPressure ?? null,
        place: payload?.place ?? null,
        notes: payload?.notes ?? null,
        created_at: new Date().toISOString(),
      };

      // Try direct insert; if your project uses RPC or a REST route, swap this call
      const { error } = await supabase.from("migraines").insert(insertPayload);
      if (error) {
        console.warn("Supabase insert error:", error.message);
      }

      // Refresh list so charts/cards update
      const refreshed = await listMigraines(user.id);
      setEpisodes(refreshed || []);
    } catch (e) {
      console.error("Save migraine failed:", e);
    } finally {
      setOpenMigraine(false);
    }
  };

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
            {/* Left: website link button + welcome */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <a
                href="https://sentinel-health.webflow.io"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Sentinel Health website"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "inherit",
                  textDecoration: "none",
                  background: "rgba(255,255,255,.12)",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                <img
                  src={logo}
                  alt="Sentinel Health"
                  width={20}
                  height={20}
                  style={{ borderRadius: 6 }}
                />
                <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Website</span>
              </a>
              <div style={{ opacity: 0.85 }}>|</div>
              <div style={{ whiteSpace: "nowrap" }}>
                Welcome{firstName ? `, ${firstName}` : ""}
              </div>
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
            className="action-row" // added so the media query in <style> applies
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
          <div className="grid grid-3">
            <StatCard title="Total Episodes" value={episodes.length || 0} />
            <StatCard
              title="Avg Glucose (14d)"
              value={(() => {
                const vals = glucose14.values.filter((v) => v != null);
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                return avg.toFixed(1);
              })()}
              suffix="mg/dL"
            />
            <StatCard
              title="Avg Sleep (14d)"
              value={(() => {
                const vals = sleep14.values;
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                return avg.toFixed(1);
              })()}
              suffix="hrs"
            />
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Panel title="Migraine Frequency (30d)" accentColor="#dc2626">
                <LineChart labels={migraine30.labels} data={migraine30.values} color={colorMigraine} className="h-[280px]" />
              </Panel>
              <Panel title="Top Symptoms" accentColor="#7c3aed">
                <PieChart labels={symptomPie.labels} data={symptomPie.values} colors={pieColors} className="h-[280px]" />
              </Panel>
            </div>

            <div className="grid grid-2">
              <Panel title="Avg Glucose (14d)" accentColor="#2563eb">
                <LineChart labels={glucose14.labels} data={glucose14.values} color={colorGlucose} className="h-[280px]" />
              </Panel>
              <Panel title="Sleep Hours (14d)" accentColor="#16a34a">
                <LineChart labels={sleep14.labels} data={sleep14.values} color={colorSleep} className="h-[280px]" />
              </Panel>
            </div>
          </div>
        </main>

        {/* Modals */}
        {/* NEW: Tailwind migraine modal */}
        <MigraineLogModal
          open={openMigraine}
          onClose={() => setOpenMigraine(false)}
          onSave={handleSaveMigraine}
        />

        {openGlucose && <GlucoseModal onClose={() => setOpenGlucose(false)} user={user} />}
        {openSleep && <SleepModal onClose={() => setOpenSleep(false)} user={user} />}
        {openSettings && <SettingsModal onClose={() => setOpenSettings(false)} />}
        {openEducation && <EducationModal onClose={() => setOpenEducation(false)} />}
      </div>
    </ToastProvider>
  );
}