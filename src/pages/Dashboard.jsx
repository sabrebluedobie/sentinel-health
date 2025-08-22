// Sentinel Dashboard.jsx — version stamp: 2025-08-22
// Requires: src/services/supabaseClient.js (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)

import React, { useEffect, useMemo, useState } from "react";
import "./../styles/dashboard.css";
import "./../styles/legacy-look.css"; // optional: restores simpler visuals

import ToastProvider from "../components/common/ToastProvider.jsx";
import { Panel, StatCard } from "../components/common/Cards.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

import MigraineModal from "../components/modals/MigraineModal.jsx";
import GlucoseModal from "../components/modals/GlucoseModal.jsx";
import SleepModal from "../components/modals/SleepModal.jsx";
import SettingsModal from "../components/modals/SettingsModal.jsx";
import EducationModal from "../components/modals/EducationModal.jsx";

import supabase from "../services/supabaseClient.js";
import { listMigraines } from "../services/migraines.js";
import { listGlucose } from "../services/glucose.js";
import { listSleep } from "../services/sleep.js";
import { getDisclaimerConsent, upsertDisclaimerConsent } from "../services/consents.js";

import { getCurrentPalette, getChartLineColor, getPieSymptomColorMap } from "../lib/brand.js";
import { daysBack, fmt, countByDate, avgByDate, sumSleepHoursByDate } from "../lib/helpers.js";

export default function Dashboard() {
  // ---- auth ----
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setAuthChecked(true);
      console.log("[Dashboard] user:", data?.user?.id, data?.user?.email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription?.unsubscribe?.();
  }, []);

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

  // ---- guards ----
  if (!authChecked) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <div style={{ padding: 16 }}>Please sign in to view your dashboard.</div>;

  // ---- render ----
  return (
    <ToastProvider>
      <div className="main">
        <header className="header safe-pad" style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, background: "rgba(255,255,255,.2)", borderRadius: 6 }} />
            <div style={{ fontWeight: 600 }}>Sentinel — Dashboard</div>

            {/* + buttons at TOP + Education + Settings */}
            <div className="actions-compact" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={() => setOpenMigraine(true)} style={{ background: "#042d4d", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>+ Migraine</button>
              <button onClick={() => setOpenGlucose(true)} style={{ background: "#7c3aed", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>+ Glucose</button>
              <button onClick={() => setOpenSleep(true)} style={{ background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>+ Sleep</button>
              <button onClick={() => setOpenEducation(true)} style={{ background: "#f59e0b", color: "#111827", padding: "8px 12px", borderRadius: 8 }}>Education</button>
              <button onClick={() => setOpenSettings(true)} style={{ fontSize: 12, padding: "8px 12px", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 6, color: "#fff" }}>
                Settings
              </button>
            </div>
          </div>
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
        {openMigraine && <MigraineModal onClose={() => setOpenMigraine(false)} user={user} />}
        {openGlucose && <GlucoseModal onClose={() => setOpenGlucose(false)} user={user} />}
        {openSleep && <SleepModal onClose={() => setOpenSleep(false)} user={user} />}
        {openSettings && <SettingsModal onClose={() => setOpenSettings(false)} />}
        {openEducation && <EducationModal onClose={() => setOpenEducation(false)} />}
      </div>
    </ToastProvider>
  );
}