// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";

// 🔁 READ FROM SUPABASE (not entities/localStorage)
import { Migraines, Glucose, Sleep } from "@/data/supabaseStore";

// charts
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";

// metrics + time formatting
import { daysBack, countByDate, avgByDate, sumByDateMinutes, fmt } from "../lib/metrics";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) navigate("/sign-in", { replace: true });
  }, [loading, user, navigate]);

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

  function onSignOut() {
    navigate("/sign-in", { replace: true });
  }

  // Header name: first_name (email) if available
  const headerIdentity = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} (${user.email})`
    : user?.email || "";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 space-y-6">
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

      {/* Recent logs */}
      <RecentEpisodes episodes={episodes.slice(0, 8)} />
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
        {episodes.map((ep) => (
          <div key={ep.id} className="py-2 text-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">
                {ep.timezone_offset_min != null
                  ? formatLocalAtEntry(ep.date, ep.timezone_offset_min)
                  : new Date(ep.date).toLocaleString()}
              </p>
              <p className="text-gray-600 break-words">
                Pain {ep.pain}/10 · {(ep.symptoms || []).slice(0, 3).join(", ")}
              </p>
            </div>
            {ep.glucose_at_start && (
              <span className="text-gray-700 shrink-0">{ep.glucose_at_start} mg/dL</span>
            )}
          </div>
        ))}
      </div>
      
{import.meta.env.MODE !== "production" && (
  <DebugPanel />
)}

    </div>
  );function DebugPanel() {
  const [info, setInfo] = React.useState({ url: "", uid: "", counts: null, error: "" });

  React.useEffect(() => {
    (async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL || "(missing)";
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || "(no user)";
        let counts = null;

        if (uid) {
          const [mig, glu, slp] = await Promise.all([
            supabase.from("migraine_episodes").select("*", { count: "exact", head: true }).eq("user_id", uid),
            supabase.from("glucose_readings").select("*", { count: "exact", head: true }).eq("user_id", uid),
            supabase.from("sleep_data").select("*", { count: "exact", head: true }).eq("user_id", uid),
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
}