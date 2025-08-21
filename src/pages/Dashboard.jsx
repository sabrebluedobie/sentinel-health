// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

// Data readers
import { Migraines, Glucose, Sleep } from "@/data/supabaseStore";
import { supabase } from "@/lib/supabase";

// Charts
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

// Metrics utils
import { daysBack, countByDate, avgByDate, sumByDateMinutes, fmt } from "../lib/metrics";

/* ----------------------------- colors ----------------------------- */
// Using Tailwind arbitrary values so no config change required.
const BRAND = {
  primary: "#042d4d",        // Sentinel deep blue
  primaryLight: "#e6eef6",   // very light blue tint
  surface: "#ffffff",
  soft: "#ececec",           // soft neutral (from Bluedobie pref)
  good: "#16a34a",           // green-600
  warn: "#f59e0b",           // amber-500
  bad: "#dc2626",            // red-600
  info: "#3b82f6",           // blue-500
  violet: "#7c3aed",         // violet-600
};

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

// meds helpers (from previous step)
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
      for (const s of ep.meds) {
        rows.push({ id: `${ep.id}:${s}`, at: baseTime, name: s, dose: "", route: "", notes: "", episodeId: ep.id });
      }
      continue;
    }
    if (Array.isArray(ep?.treatments) && ep.treatments.length) {
      for (const s of ep.treatments) {
        rows.push({ id: `${ep.id}:${s}`, at: baseTime, name: s, dose: "", route: "", notes: "", episodeId: ep.id });
      }
      continue;
    }
  }
  rows.sort((a, b) => (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0));
  return rows.slice(0, maxItems);
}

/* ----------------------------- component ----------------------------- */
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "migraine_episodes", filter: `user_id=eq.${uid}` },
        (p) => setEpisodes((prev) => mergeChange(prev, p))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${uid}` },
        (p) => setGlucose((prev) => mergeChange(prev, p))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${uid}` },
        (p) => setSleep((prev) => mergeChange(prev, p))
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // ---- metrics
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

  function onSignOut() {
    navigate("/sign-in", { replace: true });
  }

  const headerIdentity = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} (${user.email})`
    : user?.email || "";

  const dismissDisclaimer = () => {
    localStorage.setItem("sentinelDisclaimerAccepted", "true");
    setShowDisclaimer(false);
  };

  /* ----------------------------- UI ----------------------------- */
  return (
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
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg mx-4 border border-[#042d4d]/20">
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
        </div>
      )}

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-5 space-y-5">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bg-[#042d4d] text-white px-3 py-2 rounded shadow hover:opacity-90"
            onClick={() => navigate("/log")}
          >
            + Migraine
          </button>
          <button
            type="button"
            className="bg-[#7c3aed] text-white px-3 py-2 rounded shadow hover:opacity-95"
            onClick={() => navigate("/log-glucose")}
          >
            + Glucose
          </button>
          <button
            type="button"
            className="bg-[#3b82f6] text-white px-3 py-2 rounded shadow hover:opacity-95"
            onClick={() => navigate("/log-sleep")}
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
          <StatCard
            title="Total Migraine Episodes"
            value={totalEpisodes ?? 0}
            bg="bg-red-50"
            ring="ring-red-200"
            accent="text-red-700"
          />
          <StatCard
            title="Avg Glucose (14d)"
            value={avgGlucose14 ?? "—"}
            suffix={avgGlucose14 ? "mg/dL" : ""}
            bg="bg-blue-50"
            ring="ring-blue-200"
            accent="text-blue-700"
          />
          <StatCard
            title="Avg Sleep (14d)"
            value={avgSleep14 ?? "—"}
            suffix={avgSleep14 ? "hrs/night" : ""}
            bg="bg-emerald-50"
            ring="ring-emerald-200"
            accent="text-emerald-700"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Migraine Frequency (30 days)" borderColor={BRAND.bad}>
              <LineChart
                title=""
                labels={last30.labels}
                data={last30.counts}
                // Many chart wrappers accept a color/stroke prop; harmless if ignored
                color={BRAND.bad}
                className="h-[280px]"
              />
            </Panel>
          </div>
          <div>
            <Panel title="Top Symptoms" borderColor={BRAND.violet}>
              <PieChart
                title=""
                labels={symptomCounts.labels}
                data={symptomCounts.data}
                colors={[BRAND.violet, BRAND.info, BRAND.bad, BRAND.good, BRAND.warn, BRAND.primary]}
                className="h-[280px]"
              />
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Avg Glucose (14 days)" borderColor={BRAND.info}>
            <LineChart
              title=""
              labels={last14Glucose.labels}
              data={last14Glucose.values}
              color={BRAND.info}
              className="h-[280px]"
            />
          </Panel>
          <Panel title="Sleep Hours (14 days)" borderColor={BRAND.good}>
            <LineChart
              title=""
              labels={last14Sleep.labels}
              data={last14Sleep.hours}
              color={BRAND.good}
              className="h-[280px]"
            />
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
    </div>
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
      <div
        className="px-4 py-2 font-semibold text-sm text-[#042d4d] border-b"
        style={{ borderColor: `${BRAND.primary}22` }}
      >
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
                    <span className="ml-2 text-gray-700">
                      · {ep.symptoms.slice(0, 3).join(", ")}
                    </span>
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
                    <p className="text-gray-600">
                      {[m.route, m.notes].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="text-gray-600 shrink-0">
                  {m.at ? new Date(m.at).toLocaleString() : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-gray-500">
        Pulled from episode entries. Add meds when logging a migraine.
      </p>
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
      <div>
        Supabase URL: <code>{info.url}</code>
      </div>
      <div>
        User ID: <code>{info.uid}</code>
      </div>
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

/* ---------- tiny util ---------- */
function formatLocalAtEntry(dateIso, tzOffsetMinutes) {
  try {
    const d = new Date(dateIso);
    const adjusted = new Date(d.getTime() - (new Date().getTimezoneOffset() - tzOffsetMinutes) * 60000);
    return adjusted.toLocaleString();
  } catch {
    return new Date(dateIso).toLocaleString();
  }
}
