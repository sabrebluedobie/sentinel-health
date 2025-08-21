// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

import { Migraines, Glucose, Sleep } from "@/data/supabaseStore";
import { supabase } from "@/lib/supabase";

import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

import { daysBack, countByDate, avgByDate, sumByDateMinutes, fmt } from "../lib/metrics";

/* ----------------------------- colors ----------------------------- */
const BRAND = {
  primary: "#042d4d",
  primaryLight: "#e6eef6",
  surface: "#ffffff",
  soft: "#ececec",
  good: "#16a34a",
  warn: "#f59e0b",
  bad: "#dc2626",
  info: "#2563eb",
  violet: "#7c3aed",
};

/** Global chart palette for categorical series (pie slices, multiple lines/bars). */
const CHART_COLORS = [
  BRAND.primary,
  BRAND.bad,
  BRAND.good,
  BRAND.info,
  BRAND.violet,
  BRAND.warn,
  "#0ea5e9", // sky-500
  "#f97316", // orange-500
];

/* ----- preset options ----- */
const SYMPTOM_OPTIONS = [
  "Nausea","Vomiting","Photophobia","Phonophobia","Aura",
  "Dizziness","Neck pain","Numbness/tingling","Blurred vision",
  "Fatigue","Osmophobia","Allodynia"
];

const TRIGGER_OPTIONS = [
  "Stress","Lack of sleep","Dehydration","Skipped meal",
  "Bright lights","Strong smells","Hormonal","Weather",
  "Heat","Screen time","Alcohol","Chocolate","Caffeine change"
];

/* ----------------------------- Toast System ----------------------------- */
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function push(type, msg) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }
  const api = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-[1200]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-3 py-2 rounded-lg shadow text-white text-sm flex items-center gap-2`}
            style={{
              backgroundColor:
                t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#2563eb",
              maxWidth: "min(90vw, 360px)",
            }}
          >
            <span>
              {t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ----------------------------- helpers ----------------------------- */
function mergeChange(list, payload, key = "id") {
  const { eventType, new: rowNew, old: rowOld } = payload;
  if (eventType === "INSERT") {
    if (!list.find((r) => r[key] === rowNew[key])) return [rowNew, ...list];
    return list.map((r) => (r[key] === rowNew[key] ? rowNew : r));
  }
  if (eventType === "UPDATE") return list.map((r) => (r[key] === rowNew[key] ? rowNew : r));
  if (eventType === "DELETE") return list.filter((r) => r[key] !== rowOld[key]);
  return list;
}

function medsSummaryFromEpisode(ep) {
  if (Array.isArray(ep?.medications) && ep.medications.length) {
    return ep.medications
      .map((m) => {
        const name = m?.name || m?.medication || m?.drug || "Medication";
        const dose = [m?.dose, m?.unit].filter(Boolean).join(" ");
        return dose ? `${name} ${dose}` : name;
      })
      .join(", ");
  }
  if (ep?.medication_name || ep?.medication_dose || ep?.medication) {
    const nm = ep.medication_name || ep.medication || "Medication";
    const ds = [ep.medication_dose, ep.medication_unit].filter(Boolean).join(" ");
    return [nm, ds].filter(Boolean).join(" ");
  }
  if (Array.isArray(ep?.meds) && ep.meds.length) return ep.meds.join(", ");
  if (Array.isArray(ep?.treatments) && ep.treatments.length) return ep.treatments.join(", ");
  if (ep?.medication_notes) return String(ep.medication_notes);
  return "";
}

function extractMedications(episodes, maxItems = 12) {
  const rows = [];
  for (const ep of episodes) {
    const baseTime = ep?.taken_at || ep?.started_at || ep?.start_time || ep?.date || ep?.created_at || null;
    if (Array.isArray(ep?.medications) && ep.medications.length) {
      for (const m of ep.medications) {
        rows.push({
          id: `${ep.id}:${m?.id ?? m?.name ?? Math.random().toString(36).slice(2)}`,
          at: m?.taken_at || baseTime,
          name: m?.name || m?.medication || m?.drug || "Medication",
          dose: [m?.dose, m?.unit].filter(Boolean).join(" "),
          route: m?.route || "",
          notes: m?.notes || "",
          episodeId: ep.id,
        });
      }
      continue;
    }
    if (ep?.medication_name || ep?.medication || ep?.medication_dose || ep?.medication_notes) {
      rows.push({
        id: `${ep.id}:single`,
        at: baseTime,
        name: ep.medication_name || ep.medication || "Medication",
        dose: [ep.medication_dose, ep.medication_unit].filter(Boolean).join(" "),
        route: ep.medication_route || "",
        notes: ep.medication_notes || "",
        episodeId: ep.id,
      });
      continue;
    }
    if (Array.isArray(ep?.meds) && ep.meds.length) {
      for (const s of ep.meds) rows.push({ id: `${ep.id}:${s}`, at: baseTime, name: s, dose: "", route: "", notes: "", episodeId: ep.id });
      continue;
    }
    if (Array.isArray(ep?.treatments) && ep.treatments.length) {
      for (const s of ep.treatments) rows.push({ id: `${ep.id}:${s}`, at: baseTime, name: s, dose: "", route: "", notes: "", episodeId: ep.id });
      continue;
    }
  }
  rows.sort((a, b) => (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0));
  return rows.slice(0, maxItems);
}

function localTzOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

function formatLocalAtEntry(dateIso, tzOffsetMinutes) {
  try {
    const d = new Date(dateIso);
    const adjusted = new Date(d.getTime() - (new Date().getTimezoneOffset() - tzOffsetMinutes) * 60000);
    return adjusted.toLocaleString();
  } catch {
    return new Date(dateIso).toLocaleString();
  }
}

/* ----------------------------- Speech (Web Speech API) ----------------------------- */
/** Minimal hook for dictation using Web Speech API (Chrome/Edge/Samsung Internet). */
function useSpeechInput({ lang = "en-US", continuous = false, interimResults = true, onResult } = {}) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalized, setFinalized] = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      // Common: "no-speech", "audio-capture", "not-allowed"
      console.warn("Speech error:", e.error);
    };
    rec.onresult = (ev) => {
      let interimText = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        (r.isFinal ? (finalText += r[0].transcript) : (interimText += r[0].transcript));
      }
      if (interimResults) setInterim(interimText);
      if (finalText) {
        setFinalized((prev) => (prev ? `${prev} ${finalText}` : finalText));
        onResult?.(finalText);
      }
    };

    recognitionRef.current = rec;
    setSupported(true);
    return () => {
      try { rec.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [lang, continuous, interimResults, onResult]);

  const start = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setInterim("");
    try { rec.start(); } catch {}
  };
  const stop = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try { rec.stop(); } catch {}
  };

  return { supported, listening, interim, finalized, start, stop, reset: () => { setInterim(""); setFinalized(""); } };
}

/** Very light NLP to pull structured values from a transcript. */
function parseMigraineTranscript(text) {
  const out = { pain: null, symptoms: [], triggers: [], medsString: "", cleanedNotes: text?.trim?.() || "" };
  if (!text) return out;
  const t = text.toLowerCase();

  // Pain 0-10: look for "pain 7" or "pain level 7" or standalone number preceded by "pain", or "7/10"
  const painMatch = t.match(/pain(?:\s*level)?\s*(\d{1,2})/) || t.match(/\b(\d{1,2})\/?10\b/);
  if (painMatch) {
    const n = parseInt(painMatch[1], 10);
    if (!isNaN(n) && n >= 0 && n <= 10) out.pain = n;
  }

  // Symptoms/triggers: simple keyword hit from presets
  const norm = (s) => s.toLowerCase();
  const tWords = ` ${t.replace(/[^\w\s]/g, " ")} `;

  SYMPTOM_OPTIONS.forEach((s) => {
    if (tWords.includes(` ${norm(s)} `)) out.symptoms.push(s);
  });
  TRIGGER_OPTIONS.forEach((s) => {
    if (tWords.includes(` ${norm(s)} `)) out.triggers.push(s);
  });

  // Medications: naive capture of patterns like "sumatriptan 50 mg", "ibuprofen 400 milligrams"
  const medRegex = /\b([a-zA-Z][a-zA-Z\-]+)\s+(\d{1,4})\s*(mg|milligram|milligrams|mcg|microgram|g|ml|milliliter|milliliters)\b/g;
  const meds = [];
  let m;
  while ((m = medRegex.exec(t)) !== null) {
    const name = m[1];
    const dose = `${m[2]} ${m[3]}`;
    meds.push(`${capitalize(name)} ${dose.toUpperCase()}`);
  }
  if (meds.length) out.medsString = meds.join("; ");

  return out;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* ----------------------------- Speech Synthesis (TTS) ----------------------------- */
/** Minimal talker: speaks a prompt, returns a promise that resolves when audio ends. */
function speakOnce(text, { rate = 1, pitch = 1, volume = 1, lang = "en-US" } = {}) {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return resolve(); // no-op if not supported
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate; utter.pitch = pitch; utter.volume = volume; utter.lang = lang;
      utter.onend = resolve; utter.onerror = resolve;
      synth.cancel(); // stop any pending speech
      synth.speak(utter);
    } catch { resolve(); }
  });
}

/** Helper to stop any current speech. */
function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch {}
}

/* ----------------------------- main component ----------------------------- */
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

  const [openMigraine, setOpenMigraine] = useState(false);
  const [openGlucose, setOpenGlucose] = useState(false);
  const [openSleep, setOpenSleep] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/sign-in", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    const accepted = localStorage.getItem("sentinelDisclaimerAccepted");
    setShowDisclaimer(!accepted);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [e, g, s] = await Promise.all([Migraines.list(500), Glucose.list(1000), Sleep.list(365)]);
        setEpisodes(e || []);
        setGlucose(g || []);
        setSleep(s || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "migraine_episodes", filter: `user_id=eq.${uid}` },
        (p) => setEpisodes((prev) => mergeChange(prev, p)))
      .on("postgres_changes", { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${uid}` },
        (p) => setGlucose((prev) => mergeChange(prev, p)))
      .on("postgres_changes", { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${uid}` },
        (p) => setSleep((prev) => mergeChange(prev, p)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const totalEpisodes = episodes.length;

  const last30 = useMemo(() => {
    const window = daysBack(30);
    const map = countByDate(episodes, "date");
    const labels = window.map(fmt);
    const counts = labels.map((l) => map[l] || 0);
    return { labels, counts };
  }, [episodes]);

  const last14Glucose = useMemo(() => {
    const window = daysBack(14);
    const avg = avgByDate(glucose, "device_time", "value_mgdl");
    const labels = window.map(fmt);
    const values = labels.map((l) => avg[l] ?? null);
    return { labels, values };
  }, [glucose]);

  const last14Sleep = useMemo(() => {
    const window = daysBack(14);
    const sumMins = sumByDateMinutes(sleep);
    const labels = window.map(fmt);
    const hours = labels.map((l) => (sumMins[l] || 0) / 60);
    return { labels, hours };
  }, [sleep]);

  const symptomCounts = useMemo(() => {
    const counts = {};
    episodes.forEach((ep) => (ep.symptoms || []).forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: entries.map((e) => e[0]), data: entries.map((e) => e[1]) };
  }, [episodes]);

  const avgGlucose14 = useMemo(() => {
    const vals = last14Glucose.values.filter((v) => v != null);
    if (!vals.length) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [last14Glucose]);

  const avgSleep14 = useMemo(() => {
    const vals = last14Sleep.hours;
    if (!vals.length) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [last14Sleep]);

  const recentMeds = useMemo(() => extractMedications(episodes, 12), [episodes]);

  const headerIdentity = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} (${user.email})`
    : user?.email || "";

  const dismissDisclaimer = () => {
    localStorage.setItem("sentinelDisclaimerAccepted", "true");
    setShowDisclaimer(false);
  };

  function onSignOut() {
    navigate("/sign-in", { replace: true });
  }

  /* ----------------------------- UI ----------------------------- */
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#ececec]">
        {/* Top bar */}
        <header className="bg-[#042d4d] text-white">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-white/20" />
            <h1 className="text-base sm:text-lg font-semibold">
              Sentinel Health — Dashboard{headerIdentity ? ` — ${headerIdentity}` : ""}
            </h1>
            <span className="ml-auto text-xs px-2 py-1 rounded border border-white/30 bg-white/10">
              Realtime: <span className="font-semibold">ON</span>
            </span>
          </div>
        </header>

        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <Modal onClose={() => {}} noClose>
            <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg mx-4 border border-[#042d4d]/20 max-h-[85vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-[#042d4d] mb-2">Medical Disclaimer</h2>
              <p className="text-sm text-gray-700">
                Sentinel Health is a personal tracking tool and does not replace professional medical advice,
                diagnosis, or treatment. Always consult your physician with any questions regarding a medical condition.
                Do not make changes to your treatment without first consulting your physician.
              </p>
              <button
                onClick={dismissDisclaimer}
                className="mt-4 w-full rounded-md bg-[#042d4d] px-4 py-2 text-white hover:opacity-90"
              >
                I Understand
              </button>
            </div>
          </Modal>
        )}

        {/* Main */}
        <main className="mx-auto max-w-7xl px-4 py-5 space-y-5">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="bg-[#042d4d] text-white px-3 py-2 rounded shadow hover:opacity-90"
              onClick={() => setOpenMigraine(true)}
            >
              + Migraine
            </button>
            <button
              type="button"
              className="bg-[#7c3aed] text-white px-3 py-2 rounded shadow hover:opacity-95"
              onClick={() => setOpenGlucose(true)}
            >
              + Glucose
            </button>
            <button
              type="button"
              className="bg-[#2563eb] text-white px-3 py-2 rounded shadow hover:opacity-95"
              onClick={() => setOpenSleep(true)}
            >
              + Sleep
            </button>
            <button
              type="button"
              className="ml-auto border border-[#042d4d] text-[#042d4d] px-3 py-2 rounded hover:bg-[#042d4d]/5"
              onClick={onSignOut}
            >
              Sign out
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Migraine Episodes" value={totalEpisodes ?? 0} bg="bg-red-50" ring="ring-red-200" accent="text-red-700" />
            <StatCard title="Avg Glucose (14d)" value={avgGlucose14 ?? "—"} suffix={avgGlucose14 ? "mg/dL" : ""} bg="bg-blue-50" ring="ring-blue-200" accent="text-blue-700" />
            <StatCard title="Avg Sleep (14d)" value={avgSleep14 ?? "—"} suffix={avgSleep14 ? "hrs/night" : ""} bg="bg-emerald-50" ring="ring-emerald-200" accent="text-emerald-700" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Panel title="Migraine Frequency (30 days)" borderColor={BRAND.bad}>
                <LineChart title="" labels={last30.labels} data={last30.counts} color={BRAND.bad} strokeWidth={2} className="h-[280px]" />
              </Panel>
            </div>
            <div>
              <Panel title="Top Symptoms" borderColor={BRAND.violet}>
                <PieChart title="" labels={symptomCounts.labels} data={symptomCounts.data} colors={CHART_COLORS} className="h-[280px]" />
              </Panel>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Avg Glucose (14 days)" borderColor={BRAND.info}>
              <LineChart title="" labels={last14Glucose.labels} data={last14Glucose.values} color={BRAND.info} strokeWidth={2} className="h-[280px]" />
            </Panel>
            <Panel title="Sleep Hours (14 days)" borderColor={BRAND.good}>
              <LineChart title="" labels={last14Sleep.labels} data={last14Sleep.hours} color={BRAND.good} strokeWidth={2} className="h-[280px]" />
            </Panel>
          </div>

          {/* Recent logs + meds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentEpisodes episodes={episodes.slice(0, 8)} />
            <RecentMedications meds={recentMeds} />
          </div>

          {/* Dev debug */}
          {import.meta.env.MODE !== "production" && <DebugPanel />}
        </main>

        {/* ----- Quick Log Modals ----- */}
        {openMigraine && <MigraineModal onClose={() => setOpenMigraine(false)} user={user} />}
        {openGlucose && <GlucoseModal onClose={() => setOpenGlucose(false)} user={user} />}
        {openSleep && <SleepModal onClose={() => setOpenSleep(false)} user={user} />}
      </div>
    </ToastProvider>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function StatCard({ title, value, suffix, bg, ring, accent }) {
  return (
    <div className={`rounded-xl ${bg} p-4 shadow-sm ring-1 ${ring}`}>
      <p className="text-xs uppercase tracking-wide text-gray-600">{title}</p>
      <p className={`text-2xl font-semibold ${accent}`}>
        {value}{suffix ? ` ${suffix}` : ""}
      </p>
    </div>
  );
}

function Panel({ title, children, borderColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-gray-200">
      <div className="px-4 py-2 font-semibold text-sm text-[#042d4d] border-b" style={{ borderColor: `${BRAND.primary}22` }}>
        {title}
      </div>
      <div className="p-3">{children}</div>
      <div className="h-1" style={{ backgroundColor: borderColor }} />
    </div>
  );
}

function RecentEpisodes({ episodes }) {
  if (!episodes.length) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-200">
        <h3 className="text-sm font-semibold text-[#042d4d] mb-2">Recent Episodes</h3>
        <p className="text-gray-500 text-sm">No entries yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-200">
      <h3 className="text-sm font-semibold text-[#042d4d] mb-2">Recent Episodes</h3>
      <div className="divide-y">
        {episodes.map((ep) => {
          const medsText = medsSummaryFromEpisode(ep);
          return (
            <div key={ep.id} className="py-2 text-sm flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {ep.timezone_offset_min != null
                    ? formatLocalAtEntry(ep.date, ep.timezone_offset_min)
                    : new Date(ep.date).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                    Pain {ep.pain}/10
                  </span>
                  {Array.isArray(ep.symptoms) && ep.symptoms.length > 0 && (
                    <span className="ml-2 text-gray-700">· {ep.symptoms.slice(0, 3).join(", ")}</span>
                  )}
                </p>
                {medsText && (
                  <p className="text-gray-800 mt-1">
                    <span className="font-medium text-[#042d4d]">Meds:</span> {medsText}
                  </p>
                )}
              </div>
              {ep.glucose_at_start && (
                <span className="text-[#7c3aed] font-medium shrink-0">{ep.glucose_at_start} mg/dL</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentMedications({ meds }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-200">
      <h3 className="text-sm font-semibold text-[#042d4d] mb-2">Recent Medications</h3>
      {!meds.length ? (
        <p className="text-gray-500 text-sm">No medications recorded.</p>
      ) : (
        <ul className="divide-y">
          {meds.map((m) => (
            <li key={m.id} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {m.name} {m.dose ? <span className="text-gray-700">— {m.dose}</span> : ""}
                  </p>
                  {(m.route || m.notes) && (
                    <p className="text-gray-600">{[m.route, m.notes].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="text-gray-600 shrink-0">{m.at ? new Date(m.at).toLocaleString() : ""}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-gray-500">Pulled from episode entries. Add meds when logging a migraine.</p>
    </div>
  );
}

function DebugPanel() {
  const [info, setInfo] = React.useState({ url: "", uid: "", counts: null, error: "" });

  React.useEffect(() => {
    (async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL || "(missing)";
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || "(no user)";
        let counts = null;

        if (user?.id) {
          const [mig, glu, slp] = await Promise.all([
            supabase.from("migraine_episodes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("glucose_readings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("sleep_data").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          ]);
          counts = { migraines: mig.count ?? 0, glucose: glu.count ?? 0, sleep: slp.count ?? 0 };
        }

        setInfo({ url, uid, counts, error: "" });
      } catch (e) {
        setInfo((prev) => ({ ...prev, error: String(e) }));
      }
    })();
  }, []);

  return (
    <div className="mt-6 text-xs p-3 border rounded bg-white ring-1 ring-gray-200">
      <div>Supabase URL: <code>{info.url}</code></div>
      <div>User ID: <code>{info.uid}</code></div>
      {info.counts && (
        <div>
          Counts: <span className="text-red-600">🧠 {info.counts.migraines}</span>{" "}
          <span className="text-violet-700">🩸 {info.counts.glucose}</span>{" "}
          <span className="text-blue-700">😴 {info.counts.sleep}</span>
        </div>
      )}
      {info.error && <div className="text-red-600">Debug error: {info.error}</div>}
    </div>
  );
}

/* ---------- Modal shell (scroll-safe) ---------- */
function Modal({ children, onClose, noClose = false }) {
  return (
    <div className="fixed inset-0 z-[1100] bg-black/50">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            {!noClose && (
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 bg-white text-gray-700 border rounded-full w-8 h-8 shadow hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Chip selector ---------- */
function MultiSelectChips({ label, options, selected, setSelected, color = "#042d4d" }) {
  function toggle(item) {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  }
  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={`px-3 py-1 rounded-full border text-sm ${active ? "text-white" : "text-gray-700"}`}
              style={{ backgroundColor: active ? color : "white", borderColor: active ? color : "#e5e7eb" }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Quick-log Modals ---------- */
function MigraineModal({ onClose, user }) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-mm-ddTHH:MM
  const [pain, setPain] = useState(5);

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedTriggers, setSelectedTriggers] = useState([]);

  const [symptomsExtra, setSymptomsExtra] = useState("");
  const [triggersExtra, setTriggersExtra] = useState("");

  const [meds, setMeds] = useState(""); // "name dose; name dose"
  const [notes, setNotes] = useState("");

  // --- Speech to text ---
  const { supported, listening, interim, start, stop } = useSpeechInput({
    onResult: (finalChunk) => {
      if (!coach.active) {
        const parsed = parseMigraineTranscript(finalChunk);
        if (parsed.pain != null) setPain(parsed.pain);
        if (parsed.symptoms.length)
          setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...parsed.symptoms])));
        if (parsed.triggers.length)
          setSelectedTriggers((prev) => Array.from(new Set([...prev, ...parsed.triggers])));
        if (parsed.medsString)
          setMeds((prev) => (prev ? `${prev}; ${parsed.medsString}` : parsed.medsString));
        setNotes((prev) => (prev ? `${prev}\n${finalChunk}` : finalChunk));
      } else {
        handleCoachAnswer(finalChunk);
      }
    },
  });

  // --- Voice Coach (guided Q&A) ---
  const [coach, setCoach] = useState({
    active: false,
    step: 0,
    waiting: false,
  });

  const COACH_STEPS = [
    { key: "pain",     q: "On a scale of zero to ten, what is your pain level right now?" },
    { key: "symptoms", q: "Tell me your symptoms, like nausea or photophobia. You can say multiple." },
    { key: "triggers", q: "Do you notice any possible triggers, such as stress, bright lights, or lack of sleep?" },
    { key: "meds",     q: "What medications and doses did you take? For example, sumatriptan fifty milligrams." },
    { key: "notes",    q: "Any additional notes you want to add?" },
    { key: "confirm",  q: "Ready to save this entry? Say yes to save, or no to cancel." },
  ];

  async function startCoach() {
    if (!supported) {
      toast.info("Voice works best in Chrome or Edge.");
    }
    setCoach({ active: true, step: 0, waiting: false });
    stopSpeaking();
    await speakOnce("Okay. Let's log your migraine together.");
    runStep(0);
  }

  function stopCoach() {
    stopSpeaking();
    if (listening) stop();
    setCoach({ active: false, step: 0, waiting: false });
    toast.info("Voice Coach stopped. You can continue manually.");
  }

  async function runStep(i) {
    const step = COACH_STEPS[i];
    if (!step) return;
    stopSpeaking();
    await speakOnce(step.q);
    setCoach((c) => ({ ...c, step: i, waiting: true }));
    try { start(); } catch {}
  }

  function nextStep() {
    setCoach((c) => {
      const ni = c.step + 1;
      if (ni >= COACH_STEPS.length) return { active: false, step: 0, waiting: false };
      setTimeout(() => runStep(ni), 200);
      return { ...c, step: ni, waiting: false };
    });
  }

  function handleCoachAnswer(text) {
    if (listening) { try { stop(); } catch {} }
    setCoach((c) => ({ ...c, waiting: false }));
    const step = COACH_STEPS[coach.step]?.key;
    const t = text?.trim() || "";

    if (!t) {
      speakOnce("Sorry, I didn't catch that. Let's try again.");
      runStep(coach.step);
      return;
    }

    if (step === "pain") {
      const parsed = parseMigraineTranscript(t);
      if (parsed.pain != null) {
        setPain(parsed.pain);
        speakOnce(`Got it. Pain level ${parsed.pain}.`);
        return nextStep();
      } else {
        speakOnce("Please say a number from zero to ten.");
        return runStep(coach.step);
      }
    }

    if (step === "symptoms") {
      const parsed = parseMigraineTranscript(t);
      const extras = t.split(",").map(s => s.trim()).filter(Boolean);
      const unique = Array.from(new Set([...(parsed.symptoms || []), ...extras]));
      if (unique.length) {
        setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...unique])));
        speakOnce("Symptoms noted.");
      } else {
        speakOnce("Okay, no symptoms noted.");
      }
      return nextStep();
    }

    if (step === "triggers") {
      const parsed = parseMigraineTranscript(t);
      const extras = t.split(",").map(s => s.trim()).filter(Boolean);
      const unique = Array.from(new Set([...(parsed.triggers || []), ...extras]));
      if (unique.length) {
        setSelectedTriggers((prev) => Array.from(new Set([...prev, ...unique])));
        speakOnce("Triggers noted.");
      } else {
        speakOnce("Okay, no triggers noted.");
      }
      return nextStep();
    }

    if (step === "meds") {
      const parsed = parseMigraineTranscript(t);
      if (parsed.medsString) {
        setMeds((prev) => (prev ? `${prev}; ${parsed.medsString}` : parsed.medsString));
        speakOnce("Medications recorded.");
      } else {
        setMeds((prev) => (prev ? `${prev}; ${t}` : t));
        speakOnce("Okay.");
      }
      return nextStep();
    }

    if (step === "notes") {
      setNotes((prev) => (prev ? `${prev}\n${t}` : t));
      speakOnce("Added to notes.");
      return nextStep();
    }

    if (step === "confirm") {
      const yes = /\b(yes|save|yeah|yep|sure|confirm)\b/i.test(t);
      const no  = /\b(no|cancel|wait|stop)\b/i.test(t);
      if (yes) {
        speakOnce("Saving now.");
        save();
        return;
      }
      if (no) {
        speakOnce("Okay, not saving. You can review or change anything manually.");
        stopCoach();
        return;
      }
      speakOnce("Please say yes to save, or no to cancel.");
      return runStep(coach.step);
    }
  }

  useEffect(() => {
    if (!supported) {
      toast.info("Tip: Voice features work best in Chrome or Edge.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  async function save() {
    if (!user?.id) return;
    if (listening) stop();
    setSaving(true);
    try {
      const medications =
        meds.trim() === ""
          ? null
          : meds.split(";").map((chunk) => {
              const [name, ...doseParts] = chunk.trim().split(" ");
              const dose = doseParts.join(" ").trim();
              return { name, dose };
            });

      const extraSymptoms = symptomsExtra.split(",").map((s) => s.trim()).filter(Boolean);
      const symptoms = Array.from(new Set([...selectedSymptoms, ...extraSymptoms]));

      const extraTriggers = triggersExtra.split(",").map((s) => s.trim()).filter(Boolean);
      const triggers = Array.from(new Set([...selectedTriggers, ...extraTriggers]));

      const payload = {
        user_id: user.id,
        date: new Date(dateTime).toISOString(),
        pain: Number(pain),
        symptoms,                 // text[]
        triggers,                 // text[]
        medications,              // json/jsonb
        medication_notes: notes || null,
        timezone_offset_min: localTzOffsetMinutes(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("migraine_episodes").insert(payload);
      if (error) throw error;

      toast.success("Migraine log saved.");
      stopSpeaking();
      onClose(); // realtime updates list
    } catch (e) {
      toast.error(e.message || "Failed to save migraine entry.");
      stopSpeaking();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={() => { if (listening) stop(); stopCoach(); onClose(); }}>
      <div className="bg-white rounded-xl p-6 shadow-2xl border border-[#042d4d]/20 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-lg font-semibold text-[#042d4d]">Log Migraine</h3>
          <div className="flex items-center gap-2">
            {/* Free dictation button */}
            <button
              type="button"
              onClick={() => (listening ? stop() : start())}
              className={`px-3 py-1 rounded-md text-white text-sm ${listening ? "bg-red-600" : "bg-[#042d4d]"}`}
              title={supported ? "Dictate freely; I’ll parse fields" : "Voice input not supported in this browser"}
              disabled={!supported || coach.active}
            >
              {listening ? "● Listening…" : "🎙 Dictate"}
            </button>
            {/* Voice Coach controls */}
            {!coach.active ? (
              <button
                type="button"
                onClick={startCoach}
                className="px-3 py-1 rounded-md text-white text-sm bg-emerald-600"
                disabled={!supported}
                title="Guided voice Q&A"
              >
                🗣 Start Voice Coach
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCoach}
                className="px-3 py-1 rounded-md text-white text-sm bg-gray-700"
                title="Stop voice Q&A"
              >
                ⏹ Stop Coach
              </button>
            )}
          </div>
        </div>

        {coach.active && coach.waiting && (
          <div className="mb-2 text-xs text-gray-600">Listening for your answer…</div>
        )}
        {(listening && interim) && !coach.active && (
          <div className="mb-3 text-sm p-2 bg-gray-50 border rounded">
            <span className="text-gray-500">Heard: </span>
            <span className="italic">{interim}</span>
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700">
          Date & Time
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          Pain (0–10)
          <input
            type="number"
            min={0}
            max={10}
            value={pain}
            onChange={(e) => setPain(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <MultiSelectChips
          label="Symptoms"
          options={SYMPTOM_OPTIONS}
          selected={selectedSymptoms}
          setSelected={setSelectedSymptoms}
          color={BRAND.bad}
        />
        <label className="block text-sm text-gray-600 mt-2">
          Add more (comma-separated)
          <input
            type="text"
            placeholder="e.g., jaw pain, brain fog"
            value={symptomsExtra}
            onChange={(e) => setSymptomsExtra(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <MultiSelectChips
          label="Possible Triggers"
          options={TRIGGER_OPTIONS}
          selected={selectedTriggers}
          setSelected={setSelectedTriggers}
          color={BRAND.violet}
        />
        <label className="block text-sm text-gray-600 mt-2">
          Add more (comma-separated)
          <input
            type="text"
            placeholder="e.g., travel, new meds"
            value={triggersExtra}
            onChange={(e) => setTriggersExtra(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          Medications (semicolon-separated; include dose)
          <input
            type="text"
            placeholder="Sumatriptan 50 mg; Ibuprofen 400 mg"
            value={meds}
            onChange={(e) => setMeds(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Say anything—voice input or Voice Coach will append here."
          />
        </label>

        <div className="mt-4 flex gap-2 sticky bottom-0 bg-white pt-3">
          <button
            disabled={saving}
            onClick={save}
            className="bg-[#042d4d] text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { if (listening) stop(); stopCoach(); onClose(); }} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

function GlucoseModal({ onClose, user }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("glucose_readings").insert({
        user_id: user.id,
        value_mgdl: Number(value),
        device_time: new Date(when).toISOString(),
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Glucose reading saved.");
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to save glucose reading.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-6 shadow-2xl border border-[#7c3aed]/20 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#7c3aed] mb-3">Log Glucose</h3>

        <label className="block text-sm font-medium text-gray-700">
          Value (mg/dL)
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          Time
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <div className="mt-4 flex gap-2 sticky bottom-0 bg-white pt-3">
          <button
            disabled={saving}
            onClick={save}
            className="bg-[#7c3aed] text-white px-4 py-2 rounded hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

function SleepModal({ onClose, user }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const nowIso = new Date().toISOString().slice(0, 16);
  const [start, setStart] = useState(nowIso);
  const [end, setEnd] = useState(nowIso);
  const [notes, setNotes] = useState("");

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const startIso = new Date(start).toISOString();
      const endIso = new Date(end).toISOString();
      const durationMinutes = Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / 60000));

      const { error } = await supabase.from("sleep_data").insert({
        user_id: user.id,
        start_time: startIso,
        end_time: endIso,
        duration_minutes: durationMinutes,
        notes: notes || null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Sleep entry saved.");
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to save sleep entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-6 shadow-2xl border border-[#2563eb]/20 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#2563eb] mb-3">Log Sleep</h3>

        <label className="block text-sm font-medium text-gray-700">
          Start
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          End
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700 mt-3">
          Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <div className="mt-4 flex gap-2 sticky bottom-0 bg-white pt-3">
          <button
            disabled={saving}
            onClick={save}
            className="bg-[#2563eb] text-white px-4 py-2 rounded hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
