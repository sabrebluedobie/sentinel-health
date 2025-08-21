// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

// 🔁 READ FROM SUPABASE (not entities/localStorage)
import { Migraines, Glucose, Sleep } from "@/data/supabaseStore";
import { supabase } from "@/lib/supabase"; // Realtime + auth for DebugPanel

// charts
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

// metrics + time formatting
import { daysBack, countByDate, avgByDate, sumByDateMinutes, fmt } from "../lib/metrics";

/* ----------------------------- helpers ----------------------------- */

/** Merge a realtime change into a list state using a row key (default: "id"). */
function mergeChange(list, payload, key = "id") {
  const { eventType, new: rowNew, old: rowOld } = payload;
  if (eventType === "INSERT") {
    if (!list.find((r) => r[key] === rowNew[key])) return [rowNew, ...list];
    return list.map((r) => (r[key] === rowNew[key] ? rowNew : r));
  }
  if (eventType === "UPDATE") {
    return list.map((r) => (r[key] === rowNew[key] ? rowNew : r));
  }
  if (eventType === "DELETE") {
    return list.filter((r) => r[key] !== rowOld[key]);
  }
  return list;
}

/** Extract a concise meds string from a single episode (supports multiple shapes). */
function medsSummaryFromEpisode(ep) {
  // Array of structured meds: [{ name, dose, unit, route, taken_at, notes }]
  if (Array.isArray(ep?.medications) && ep.medications.length) {
    return ep.medications
      .map((m) => {
        const name = m?.name || m?.medication || m?.drug || "Medication";
        const dose = [m?.dose, m?.unit].filter(Boolean).join(" ");
        return dose ? `${name} ${dose}` : name;
      })
      .join(", ");
  }

  // Single fields (name + dose)
  if (ep?.medication_name || ep?.medication_dose || ep?.medication) {
    const nm = ep.medication_name || ep.medication || "Medication";
    const ds = [ep.medication_dose, ep.medication_unit].filter(Boolean).join(" ");
    return [nm, ds].filter(Boolean).join(" ");
  }

  // Arrays of strings (meds/treatments)
  if (Array.isArray(ep?.meds) && ep.meds.length) return ep.meds.join(", ");
  if (Array.isArray(ep?.treatments) && ep.treatments.length) return ep.treatments.join(", ");

  // Freeform notes about medication
  if (ep?.medication_notes) return String(ep.medication_notes);

  return ""; // none found
}

/** Flatten medications from episodes into a list for a "Recent Medications" panel. */
function extractMedications(episodes, maxItems = 20) {
  const rows = [];
  for (const ep of episodes) {
    const baseTime =
      ep?.taken_at ||
      ep?.started_at ||
      ep?.start_time ||
      ep?.date ||
      ep?.created_at ||
      null;

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
        rows.push({
          id: `${ep.id}:${s}`,
          at: baseTime,
          name: s,
          dose: "",
          route: "",
          notes: "",
          episodeId: ep.id,
        });
      }
      continue;
    }

    if (Array.isArray(ep?.treatments) && ep.treatments.length) {
      for (const s of ep.treatments) {
        rows.push({
          id: `${ep.id}:${s}`,
          at: baseTime,
          name: s,
          dose: "",
          route: "",
          notes: "",
          episodeId: ep.id,
        });
      }
      continue;
    }
  }

  // Sort newest first by 'at' (fallback to episode id order if missing)
  rows.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });

  return rows.slice(0, maxItems);
}

/* ----------------------------- component ----------------------------- */

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Disclaimer
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Data
  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) navigate("/sign-in", { replace: true });
  }, [loading, user, navigate]);

  // Show disclaimer on first load (remember acceptance)
  useEffect(() => {
    const accepted = localStorage.getItem("sentinelDisclaimerAccepted");
    setShowDisclaimer(!accepted);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [e, g, s] = await Promise.all([
          Migraines.list(500),
          Glucose.list(1000),
          Sleep.list(365),
        ]);
        setEpisodes(e || []);
        setGlucose(g || []);
        setSleep(s || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    })();
  }, []);

  // Realtime subscriptions (user-scoped)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // --- Summary metrics ---
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
    episodes.forEach((ep) => {
      (ep.symptoms || []).forEach((s) => (counts[s] = (counts[s] || 0) + 1));
    });
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

  // Derived: recent medications (flattened from episodes)
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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-2">Medical Disclaimer</h2>
            <p className="text-sm text-gray-700">
              Sentinel Health is a personal tracking tool and does not replace professional medical advice,
              diagnosis, or treatment. Always consult your physician with any questions regarding a medical condition.
              Do not make changes to your treatment without first consulting your physician.
            </p>
            <button
              onClick={dismissDisclaimer}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold break-words">
        Sentinel Health — Dashboard{headerIdentity ? ` — ${headerIdentity}` : ""}
      </h1>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log")}>
          + Migraine
        </button>
        <button type="button" className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log-glucose")}>
          + Glucose
        </button>
        <button type="button" className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log-sleep")}>
          + Sleep
        </button>
        <button type="button" className="border px-3 py-2 rounded w-full sm:w-auto" onClick={onSignOut}>
          Sign out
        </button>

        {/* Realtime indicator (visible when user loaded) */}
        {user?.id && (
          <span className="ml-auto text-xs text-gray-600 px-2 py-1 border rounded">
            Realtime: <span className="font-semibold">ON</span>
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <Card title="Total Migraine Episodes" value={totalEpisodes ?? 0} />
        <Card title="Avg Glucose (14d)" value={avgGlucose14} suffix={avgGlucose14 ? "mg/dL" : ""} />
        <Card title="Avg Sleep (14d)" value={avgSleep14} suffix={avgSleep14 ? "hrs/night" : ""} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 min-w-0">
          <LineChart
            title="Migraine Frequency (30 days)"
            labels={last30.labels}
            data={last30.counts}
            className="h-[240px] sm:h-[280px] lg:h-[320px]"
          />
        </div>
        <div className="min-w-0">
          <PieChart
            title="Top Symptoms"
            labels={symptomCounts.labels}
            data={symptomCounts.data}
            className="h-[240px] sm:h-[280px] lg:h-[320px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <LineChart
            title="Avg Glucose (14 days)"
            labels={last14Glucose.labels}
            data={last14Glucose.values}
            className="h-[240px] sm:h-[280px] lg:h-[320px]"
          />
        </div>
        <div className="min-w-0">
          <LineChart
            title="Sleep Hours (14 days)"
            labels={last14Sleep.labels}
            data={last14Sleep.hours}
            className="h-[240px] sm:h-[280px] lg:h-[320px]"
          />
        </div>
      </div>

      {/* Recent logs + Recent medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <RecentEpisodes episodes={episodes.slice(0, 8)} />
        <RecentMedications meds={recentMeds} />
      </div>

      {/* Debug (non-prod only) */}
      {import.meta.env.MODE !== "production" && <DebugPanel />}
    </div>
  );
}

/* ---------- Components ---------- */

function Card({ title, value, suffix }) {
  const display = (value === null || value === undefined || value === "") ? "—" : value;
  return (
    <div className="bg-white rounded-lg p-4 shadow min-w-0 box-border">
      <div className="min-w-0">
        <p className="text-xs uppercase text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-semibold break-words">
          {display}{suffix ? ` ${suffix}` : ""}
        </p>
      </div>
    </div>
  );
}

function RecentEpisodes({ episodes }) {
  if (!episodes.length)
    return (
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-sm font-semibold mb-2">Recent Episodes</h3>
        <p className="text-gray-500 text-sm">No entries yet.</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="text-sm font-semibold mb-2">Recent Episodes</h3>
      <div className="divide-y">
        {episodes.map((ep) => {
          const medsText = medsSummaryFromEpisode(ep);
          return (
            <div key={ep.id} className="py-2 text-sm flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {ep.timezone_offset_min != null
                    ? formatLocalAtEntry(ep.date, ep.timezone_offset_min)
                    : new Date(ep.date).toLocaleString()}
                </p>
                <p className="text-gray-600 break-words">
                  Pain {ep.pain}/10 · {(ep.symptoms || []).slice(0, 3).join(", ")}
                </p>
                {medsText && (
                  <p className="text-gray-700 mt-0.5">
                    <span className="font-medium">Meds:</span> {medsText}
                  </p>
                )}
              </div>
              {ep.glucose_at_start && (
                <span className="text-gray-700 shrink-0">{ep.glucose_at_start} mg/dL</span>
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
    <div className="bg-white rounded-lg p-4 shadow min-w-0">
      <h3 className="text-sm font-semibold mb-2">Recent Medications</h3>
      {!meds.length ? (
        <p className="text-gray-500 text-sm">No medications recorded.</p>
      ) : (
        <ul className="divide-y">
          {meds.map((m) => (
            <li key={m.id} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium break-words">
                    {m.name} {m.dose ? `— ${m.dose}` : ""}
                  </p>
                  {(m.route || m.notes) && (
                    <p className="text-gray-600 break-words">
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
        Pulled from episode entries. To add meds, include them when logging a migraine.
      </p>
    </div>
  );
}

/* ---------- Debug panel (dev only) ---------- */

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
          counts = {
            migraines: mig.count ?? 0,
            glucose: glu.count ?? 0,
            sleep: slp.count ?? 0,
          };
        }

        setInfo({ url, uid, counts, error: "" });
      } catch (e) {
        setInfo((prev) => ({ ...prev, error: String(e) }));
      }
    })();
  }, []);

  return (
    <div className="mt-6 text-xs p-3 border rounded bg-gray-50">
      <div>Supabase URL: <code>{info.url}</code></div>
      <div>User ID: <code>{info.uid}</code></div>
      {info.counts && (
        <div>Counts (RLS-filtered): 🧠 {info.counts.migraines} | 🩸 {info.counts.glucose} | 😴 {info.counts.sleep}</div>
      )}
      {info.error && <div className="text-red-600">Debug error: {info.error}</div>}
    </div>
  );
}

/* ---------- tiny util from your codebase ---------- */

function formatLocalAtEntry(dateIso, tzOffsetMinutes) {
  try {
    const d = new Date(dateIso);
    // adjust by the stored offset to display the local-at-entry time
    const adjusted = new Date(d.getTime() - (new Date().getTimezoneOffset() - tzOffsetMinutes) * 60000);
    return adjusted.toLocaleString();
  } catch {
    return new Date(dateIso).toLocaleString();
  }
}
