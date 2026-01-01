import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import useDailyMetrics from "@/hooks/useDailyMetrics";
import useMigraineCorrelations from "@/hooks/useMigraineCorrelations";
import ChartCard from "@/components/ChartCard.jsx";
import DetailedGlucoseChart from "@/components/DetailedGlucoseChart";
import ErrorButton from "../../sentryaTest"


export default function Dashboard({ moduleProfile, moduleProfileLoading }) {
  const [range, setRange] = useState(30);
  const [refreshKey, setRefreshKey] = useState(0);

  const ErrorButton = () => (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="px-4 py-2 bg-red-600 text-white rounded-md"
    >
      Break the world
    </button>
  );
  // If you ever use this, wire it to your log pages/components.
  // eslint-disable-next-line no-unused-vars
  const handleDataLogged = () => setRefreshKey((prev) => prev + 1);

  const enabled = moduleProfile?.enabled_modules || {};
  const hasGlucose = !!enabled.glucose;
  const hasSleep = !!enabled.sleep;
  const hasMigraine = !!enabled.migraine;
  const hasPain = !!enabled.pain;
  const hasMedication = !!enabled.medication;

  const dm =
    (typeof useDailyMetrics === "function" && useDailyMetrics(range, refreshKey)) || {
      rows: [],
      loading: false,
      error: null,
    };

  const rows = dm?.rows ?? [];
  const loading = dm?.loading ?? false;

  const corr =
    (typeof useMigraineCorrelations === "function" &&
      useMigraineCorrelations(rows)) || {
      pain_vs_glucose: null,
      pain_vs_sleep: null,
      pain_vs_glucose_lag1: null,
      pain_vs_sleep_lag1: null,
    };

  // Normalize data the charts will use
  const data = useMemo(
    () =>
      rows.map((r) => ({
        day: new Date(r.day ?? r.date ?? r.started_at ?? Date.now()).toLocaleDateString(),
        migraine_count: Number(r.migraine_count ?? r.count ?? 0),
        pain: Number(r.avg_pain ?? r.pain ?? 0),
        glucose: Number(r.avg_glucose ?? r.glucose ?? 0),
        sleep: Number(r.sleep_hours ?? r.total_sleep_hours ?? 0),
        sleep_score: Number(r.sleep_score ?? 0),
        body_battery: Number(r.body_battery ?? 0),
      })),
    [rows]
  );

  const showInsights = (hasGlucose && hasPain) || (hasSleep && hasPain);

  return (
    <div className="space-y-6">
      {/* Range + quick actions */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-5">
        <div className="flex items-center gap-3">
          <div className="font-medium">Range</div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  range === d
                    ? "bg-blue-50 border-blue-600 text-blue-800"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={() => setRange(120)}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                range === 120
                  ? "bg-blue-50 border-blue-600 text-blue-800"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              120d+
            </button>
          </div>

          <div className="ml-auto text-sm text-zinc-500">
            {loading ? "Loading…" : `${data.length} days`}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hasGlucose && (
            <Link
              to="/glucose"
              className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            >
              <div className="text-sm font-medium">Log Glucose</div>
              <div className="text-xs text-zinc-500">Manual mg/dL reading</div>
            </Link>
          )}

          {hasSleep && (
            <Link
              to="/sleep"
              className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            >
              <div className="text-sm font-medium">Log Sleep</div>
              <div className="text-xs text-zinc-500">Record last night</div>
            </Link>
          )}

          {hasMigraine && (
            <Link
              to="/migraine"
              className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            >
              <div className="text-sm font-medium">Log Migraine</div>
              <div className="text-xs text-zinc-500">Pain 0–10 + notes</div>
            </Link>
          )}

          {hasPain && (
            <Link
              to="/pain"
              className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            >
              <div className="text-sm font-medium">Log Pain</div>
              <div className="text-xs text-zinc-500">General pain tracking</div>
            </Link>
          )}

          {hasMedication && (
            <Link
              to="/medication"
              className="rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            >
              <div className="text-sm font-medium">Log Medication</div>
              <div className="text-xs text-zinc-500">Track doses & adherence</div>
            </Link>
          )}

          {!moduleProfileLoading &&
            !hasGlucose &&
            !hasSleep &&
            !hasMigraine &&
            !hasPain &&
            !hasMedication && (
              <div className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-600 lg:col-span-4">
                No tracking modules are enabled yet. Go to <Link className="underline" to="/settings">Settings</Link> to
                turn on what you want to track.
              </div>
            )}
        </div>
      </div>

      {/* Detailed CGM Chart - show only if Glucose module enabled */}
      {hasGlucose && <DetailedGlucoseChart rangeDays={7} />}

      {/* Log charts */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Migraine days */}
        {hasMigraine && (
          <ChartCard title={`Migraine Days (${range}d)`} subtitle="Daily count of migraine entries">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Date', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    domain={[0, "auto"]} 
                    label={{ value: 'Episodes', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="migraine_count"
                    stroke="#991b1b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Sleep log */}
        {hasSleep && (
          <ChartCard title={`Sleep Log (${range}d)`} subtitle="Total sleep hours per day">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Date', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, "auto"]} 
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Glucose daily averages */}
        {hasGlucose && (
          <ChartCard title={`Glucose Avg (${range}d)`} subtitle="Average mg/dL per day">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Date', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, "auto"]} 
                    label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="glucose"
                    stroke="#6b21a8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Sleep Quality Score */}
        {hasSleep && (
          <ChartCard title={`Sleep Quality (${range}d)`} subtitle="Sleep score & body battery">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Date', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sleep_score"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Sleep Score"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="body_battery"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Body Battery"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Combined charts & insights */}
      {showInsights && (
        <div className="grid gap-4 lg:grid-cols-3">
          {hasGlucose && hasPain && (
            <ChartCard title={`Glucose ↔ Pain (${range}d)`}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" domain={[0, "auto"]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="glucose"
                      stroke="#6b21a8"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pain"
                      stroke="#991b1b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          <ChartCard title="Insights (beta)" subtitle="Correlation −1..1 (|0.5|≈moderate)">
            <ul className="text-sm space-y-2">
              {hasGlucose && hasPain && (
                <li className="flex items-center justify-between">
                  <span>Glucose vs pain:</span>
                  <span>
                    <b>{fmtCorr(corr.pain_vs_glucose)}</b>
                    {corr.pain_vs_glucose && (
                      <span className={`ml-2 text-xs ${getConfidenceColor(corr.pain_vs_glucose.n)}`}>
                        (n={corr.pain_vs_glucose.n})
                      </span>
                    )}
                  </span>
                </li>
              )}
              {hasSleep && hasPain && (
                <li className="flex items-center justify-between">
                  <span>Sleep vs pain:</span>
                  <span>
                    <b>{fmtCorr(corr.pain_vs_sleep)}</b>
                    {corr.pain_vs_sleep && (
                      <span className={`ml-2 text-xs ${getConfidenceColor(corr.pain_vs_sleep.n)}`}>
                        (n={corr.pain_vs_sleep.n})
                      </span>
                    )}
                  </span>
                </li>
              )}
              {hasGlucose && hasPain && (
                <li className="flex items-center justify-between">
                  <span>Yday glucose → pain:</span>
                  <span>
                    <b>{fmtCorr(corr.pain_vs_glucose_lag1)}</b>
                    {corr.pain_vs_glucose_lag1 && (
                      <span className={`ml-2 text-xs ${getConfidenceColor(corr.pain_vs_glucose_lag1.n)}`}>
                        (n={corr.pain_vs_glucose_lag1.n})
                      </span>
                    )}
                  </span>
                </li>
              )}
              {hasSleep && hasPain && (
                <li className="flex items-center justify-between">
                  <span>Yday sleep → pain:</span>
                  <span>
                    <b>{fmtCorr(corr.pain_vs_sleep_lag1)}</b>
                    {corr.pain_vs_sleep_lag1 && (
                      <span className={`ml-2 text-xs ${getConfidenceColor(corr.pain_vs_sleep_lag1.n)}`}>
                        (n={corr.pain_vs_sleep_lag1.n})
                      </span>
                    )}
                  </span>
                </li>
              )}
            </ul>
            {shouldShowWarning(corr) && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ Small sample size (n&lt;10). Log more data for reliable insights.
              </div>
            )}
          </ChartCard>

          {hasSleep && hasPain && (
            <ChartCard title={`Sleep ↔ Pain (${range}d)`}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" domain={[0, "auto"]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sleep"
                      stroke="#1e3a8a"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pain"
                      stroke="#991b1b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(v) {
  return v === null || Number.isNaN(v) ? "—" : Number(v).toFixed(2);
}

// Format correlation with sample size
function fmtCorr(corrObj) {
  if (!corrObj || corrObj.r === null || Number.isNaN(corrObj.r)) return "—";
  return Number(corrObj.r).toFixed(2);
}

// Color code based on sample size confidence
function getConfidenceColor(n) {
  if (n >= 30) return "text-green-600"; // Good sample size
  if (n >= 10) return "text-yellow-600"; // Moderate
  return "text-red-600"; // Too small
}

// Check if we should show a warning about sample size
function shouldShowWarning(corr) {
  const allCorrs = [
    corr.pain_vs_glucose,
    corr.pain_vs_sleep,
    corr.pain_vs_glucose_lag1,
    corr.pain_vs_sleep_lag1,
  ];
  
  // Show warning if any correlation has n < 10 and isn't null
  return allCorrs.some(c => c && c.n > 0 && c.n < 10);
}
