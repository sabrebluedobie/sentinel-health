// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";
import { MigrainEpisode, GlucoseReading, SleepData } from "../entities/client";
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";
import { daysBack, countByDate, avgByDate, sumByDateMinutes, fmt } from "../lib/metrics";
// Dashboard.jsx
import DisclaimerGate from "@/components/DisclaimerGate";

export default function Dashboard() {
  return (
    <DisclaimerGate>
      {/* your existing dashboard here */}
      <main className="p-4">
        {/* ... charts/cards/tables ... */}
      </main>
    </DisclaimerGate>
  );
}


export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [sleep, setSleep] = useState([]);

  useEffect(() => {
    if (!loading && !user) navigate("/sign-in", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    (async () => {
      const [e, g, s] = await Promise.all([
        MigrainEpisode.list("-date", 500),
        GlucoseReading.list("-date", 1000),
        SleepData.list("-date", 365),
      ]);
      setEpisodes(e || []);
      setGlucose(g || []);
      setSleep(s || []);
    })();
  }, []);

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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold break-words">
        Sentinel Health — Dashboard{user?.email ? ` (${user.email})` : ""}
      </h1>

      {/* Quick actions - own row under header */}
      <div className="flex flex-wrap gap-2">
        <button className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log")}>
          + Migraine
        </button>
        <button className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log-glucose")}>
          + Glucose
        </button>
        <button className="border px-3 py-2 rounded w-full sm:w-auto" onClick={() => navigate("/log-sleep")}>
          + Sleep
        </button>
        <button className="border px-3 py-2 rounded w-full sm:w-auto" onClick={onSignOut}>
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

/* ---------- Components below the main component ---------- */

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
              <p className="font-medium break-words">{new Date(ep.date).toLocaleString()}</p>
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
    </div>
  );
}
