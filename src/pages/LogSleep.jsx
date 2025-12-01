import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Battery, Moon, Zap, Activity, Heart, Wind } from "lucide-react";

// Calculate sleep score from hours + quality + restfulness
function calculateSleepScore(hoursSlept, sleepQuality, restfulness) {
  if (!hoursSlept || !sleepQuality || !restfulness) return null;
  const cappedHours = Math.min(hoursSlept, 10);
  const score = (cappedHours * 10) + (sleepQuality * 2) + restfulness;
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Auto-calculate quality from sleep stages
function calculateQualityFromStages(deep, light, rem, awake, totalHours) {
  if (!deep || !totalHours) return null;
  
  const totalMinutes = totalHours * 60;
  const deepPct = (deep / totalMinutes) * 100;
  const remPct = rem ? (rem / totalMinutes) * 100 : 0;
  const awakePct = awake ? (awake / totalMinutes) * 100 : 0;
  
  let score = 5;
  
  // Deep sleep scoring (15-25% is ideal)
  if (deepPct >= 15 && deepPct <= 25) score += 3;
  else if (deepPct >= 10 && deepPct < 15) score += 1;
  else if (deepPct > 25) score += 2;
  
  // REM bonus (20-25% is ideal)
  if (remPct >= 20 && remPct <= 25) score += 2;
  else if (remPct >= 15) score += 1;
  
  // Awake penalty
  if (awakePct < 5) score += 1;
  else if (awakePct > 10) score -= 2;
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

// Auto-calculate restfulness from physiology
function calculateRestfulnessFromPhysiology(restingHR, hrv, avgSpo2) {
  if (!restingHR) return null;
  
  let score = 5;
  
  // Lower HR = better rest
  if (restingHR < 60) score += 3;
  else if (restingHR < 70) score += 2;
  else if (restingHR < 80) score += 1;
  else if (restingHR >= 90) score -= 2;
  
  // HRV bonus
  if (hrv) {
    if (hrv > 50) score += 2;
    else if (hrv > 30) score += 1;
  }
  
  // SpO2 check
  if (avgSpo2) {
    if (avgSpo2 >= 95) score += 1;
    else if (avgSpo2 < 90) score -= 2;
  }
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

function getSleepScoreLabel(score) {
  if (score === null) return { label: "Enter data to calculate", color: "text-zinc-500" };
  if (score >= 85) return { label: "Doberman-Level Sleep 🐕", color: "text-green-600" };
  if (score >= 70) return { label: "Great Sleep", color: "text-blue-600" };
  if (score >= 50) return { label: "Okay Sleep", color: "text-amber-600" };
  if (score >= 30) return { label: "Rough Night", color: "text-red-600" };
  return { label: "Barely Slept", color: "text-red-800" };
}

export default function LogSleep() {
  const navigate = useNavigate();

  // Basic sleep data
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  
  // Entry mode
  const [entryMode, setEntryMode] = useState("manual"); // "manual" or "wearable"
  
  // Manual ratings
  const [manualQuality, setManualQuality] = useState("");
  const [manualRestfulness, setManualRestfulness] = useState("");
  
  // Wearable data
  const [deepSleep, setDeepSleep] = useState("");
  const [lightSleep, setLightSleep] = useState("");
  const [remSleep, setRemSleep] = useState("");
  const [awakeTime, setAwakeTime] = useState("");
  const [restingHR, setRestingHR] = useState("");
  const [hrv, setHrv] = useState("");
  const [avgSpo2, setAvgSpo2] = useState("");
  const [lowestSpo2, setLowestSpo2] = useState("");
  const [avgResp, setAvgResp] = useState("");
  const [bodyBatteryChange, setBodyBatteryChange] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  // Calculated values
  const [hoursSlept, setHoursSlept] = useState(null);
  const [effectiveQuality, setEffectiveQuality] = useState(null);
  const [effectiveRestfulness, setEffectiveRestfulness] = useState(null);
  const [sleepScore, setSleepScore] = useState(null);
  const [bodyBattery, setBodyBattery] = useState(null);

  function hoursBetween(a, b) {
    const sa = new Date(a).getTime();
    const sb = new Date(b).getTime();
    if (!Number.isFinite(sa) || !Number.isFinite(sb)) return null;
    return Math.max(0, (sb - sa) / (1000 * 60 * 60));
  }

  // Recalculate everything when data changes
  useEffect(() => {
    const hours = hoursBetween(start, end);
    setHoursSlept(hours);
    
    let quality, restfulness;
    
    if (entryMode === "manual") {
      quality = manualQuality ? Number(manualQuality) : null;
      restfulness = manualRestfulness ? Number(manualRestfulness) : null;
    } else {
      // Calculate from wearable data
      quality = calculateQualityFromStages(
        deepSleep ? Number(deepSleep) : null,
        lightSleep ? Number(lightSleep) : null,
        remSleep ? Number(remSleep) : null,
        awakeTime ? Number(awakeTime) : null,
        hours
      );
      restfulness = calculateRestfulnessFromPhysiology(
        restingHR ? Number(restingHR) : null,
        hrv ? Number(hrv) : null,
        avgSpo2 ? Number(avgSpo2) : null
      );
    }
    
    setEffectiveQuality(quality);
    setEffectiveRestfulness(restfulness);
    
    if (hours !== null && quality && restfulness) {
      const score = calculateSleepScore(hours, quality, restfulness);
      setSleepScore(score);
      setBodyBattery(Math.round(score * 0.8));
    } else {
      setSleepScore(null);
      setBodyBattery(null);
    }
  }, [start, end, entryMode, manualQuality, manualRestfulness, deepSleep, lightSleep, remSleep, awakeTime, restingHR, hrv, avgSpo2]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!start || !end) {
      setBusy(false);
      setError("Start and end times are required.");
      return;
    }

    const total = hoursBetween(start, end);
    if (total === null) {
      setBusy(false);
      setError("Invalid date(s).");
      return;
    }
    
    if (entryMode === "manual" && (!manualQuality || !manualRestfulness)) {
      setBusy(false);
      setError("Please rate your sleep quality and restfulness.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You must be signed in to save.");
      return;
    }

    const payload = {
      user_id: user.id,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      total_sleep_hours: Number(total.toFixed(2)),
      data_source: entryMode,
      notes: notes || null,
      
      // Manual ratings (if provided)
      sleep_quality: manualQuality ? Number(manualQuality) : effectiveQuality,
      restfulness: manualRestfulness ? Number(manualRestfulness) : effectiveRestfulness,
      
      // Wearable data (if provided)
      deep_sleep_minutes: deepSleep ? Number(deepSleep) : null,
      light_sleep_minutes: lightSleep ? Number(lightSleep) : null,
      rem_sleep_minutes: remSleep ? Number(remSleep) : null,
      awake_minutes: awakeTime ? Number(awakeTime) : null,
      resting_heart_rate: restingHR ? Number(restingHR) : null,
      hrv: hrv ? Number(hrv) : null,
      avg_spo2: avgSpo2 ? Number(avgSpo2) : null,
      lowest_spo2: lowestSpo2 ? Number(lowestSpo2) : null,
      avg_respiration: avgResp ? Number(avgResp) : null,
      body_battery_change: bodyBatteryChange ? Number(bodyBatteryChange) : null,
      
      // Calculated scores
      sleep_score: sleepScore,
      body_battery_recovery: bodyBattery,
    };

    const { error: insErr } = await supabase.from("sleep_data").insert([payload]);

    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    navigate("/");
  }

  const scoreInfo = getSleepScoreLabel(sleepScore);

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
            ← Back
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 mb-2">
            <Moon className="text-indigo-600" size={24} />
            Log Sleep
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Track sleep manually or import from your wearable device (Garmin, Apple Watch, etc.)
          </p>

          {/* Entry Mode Toggle */}
          <div className="mb-6 flex gap-3">
            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                entryMode === "manual"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              ✋ Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("wearable")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                entryMode === "wearable"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              ⌚ From Wearable
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Sleep Times - Always show */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Went to bed
                </label>
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Woke up
                </label>
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            {hoursSlept !== null && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-900">
                <strong>Total sleep:</strong> {hoursSlept.toFixed(1)} hours
              </div>
            )}

            {/* MANUAL MODE */}
            {entryMode === "manual" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-2">
                    Sleep Quality (1-10) *
                  </label>
                  <p className="text-xs text-zinc-500 mb-3">
                    1 = Terrible • 5 = Average • 10 = Perfect
                  </p>
                  <div className="grid grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualQuality(val.toString())}
                        className={`h-10 rounded-md font-medium transition-colors ${
                          manualQuality === val.toString()
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-2">
                    Restfulness (1-10) *
                  </label>
                  <p className="text-xs text-zinc-500 mb-3">
                    1 = Tossed all night • 10 = Woke up refreshed
                  </p>
                  <div className="grid grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualRestfulness(val.toString())}
                        className={`h-10 rounded-md font-medium transition-colors ${
                          manualRestfulness === val.toString()
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* WEARABLE MODE */}
            {entryMode === "wearable" && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-600" />
                    Sleep Stages (from your device)
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Deep Sleep (minutes)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={deepSleep}
                        onChange={(e) => setDeepSleep(e.target.value)}
                        placeholder="237"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Light Sleep (minutes)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={lightSleep}
                        onChange={(e) => setLightSleep(e.target.value)}
                        placeholder="189"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        REM Sleep (minutes)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={remSleep}
                        onChange={(e) => setRemSleep(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Awake Time (minutes)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={awakeTime}
                        onChange={(e) => setAwakeTime(e.target.value)}
                        placeholder="16"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                    <Heart size={18} className="text-red-600" />
                    Physiological Metrics
                  </h3>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Resting HR (bpm)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={restingHR}
                        onChange={(e) => setRestingHR(e.target.value)}
                        placeholder="68"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        HRV (ms)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={hrv}
                        onChange={(e) => setHrv(e.target.value)}
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Avg SpO₂ (%)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={avgSpo2}
                        onChange={(e) => setAvgSpo2(e.target.value)}
                        placeholder="92"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Lowest SpO₂ (%)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={lowestSpo2}
                        onChange={(e) => setLowestSpo2(e.target.value)}
                        placeholder="81"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Avg Respiration
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={avgResp}
                        onChange={(e) => setAvgResp(e.target.value)}
                        placeholder="17"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-800 mb-1">
                        Body Battery +/-
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        value={bodyBatteryChange}
                        onChange={(e) => setBodyBatteryChange(e.target.value)}
                        placeholder="+4"
                      />
                    </div>
                  </div>
                  
                  {effectiveQuality && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <strong>Auto-calculated:</strong> Quality {effectiveQuality}/10, Restfulness {effectiveRestfulness}/10
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sleep Score Display */}
            {sleepScore !== null && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-zinc-700 mb-1">Sleep Score</div>
                    <div className="text-4xl font-bold text-indigo-600 mb-1">{sleepScore}</div>
                    <div className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                      <Battery size={16} />
                      Body Battery Recovery
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-1">+{bodyBattery}</div>
                    <div className="text-sm text-zinc-600">
                      {bodyBattery >= 70 ? "Fully Charged" : bodyBattery >= 50 ? "Good Energy" : "Low Battery"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">Notes (optional)</label>
              <textarea
                rows={3}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Took melatonin, woke up twice, vivid dreams..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2.5 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save Sleep Log"}
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-6 py-2.5 text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}