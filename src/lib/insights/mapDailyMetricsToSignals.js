// src/lib/insights/mapDailyMetricsToSignals.js

// Translates daily_metrics rows into neutral, interpretable signals
export function mapDailyMetricsToSignals(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const signals = [];

  const sorted = [...rows].sort((a, b) => new Date(b.day) - new Date(a.day));
  const recent = sorted.slice(0, 7);

  // ---- Migraine frequency ----
  const migraineDays = recent.filter((r) => Number.isFinite(r.migraine_count));
  if (migraineDays.length >= 2) {
    const totalMigraines = migraineDays.reduce((sum, r) => sum + r.migraine_count, 0);

    if (totalMigraines >= 3) {
      signals.push({
        label: "Increased migraine frequency",
        severity: totalMigraines >= 5 ? "high" : "medium",
        delta: totalMigraines,
        escalation: totalMigraines >= 5 ? "high" : "medium",
        timeSensitive: true,

        category: "migraines",
        actionable: false,
        informational: false,
      });
    }
  }

  // ---- Average pain ----
  const painValues = recent.map((r) => r.avg_pain).filter((v) => Number.isFinite(v));
  if (painValues.length >= 2) {
    const avgPain = painValues.reduce((a, b) => a + b, 0) / painValues.length;

    if (avgPain >= 5) {
      signals.push({
        label: "Elevated average pain levels",
        severity: avgPain >= 7 ? "high" : "medium",
        delta: Math.round(avgPain * 10) / 10,
        timeSensitive: false,

        category: "pain",
        actionable: false,
        informational: false,
      });
    }
  }

  // ---- Sleep quantity ----
  const sleepHours = recent.map((r) => r.sleep_hours).filter((v) => Number.isFinite(v));
  if (sleepHours.length >= 2) {
    const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;

    if (avgSleep < 6) {
      signals.push({
        label: "Low average sleep duration",
        severity: avgSleep < 5 ? "high" : "medium",
        delta: Math.round(avgSleep * 10) / 10,
        timeSensitive: false,

        category: "sleep",
        actionable: false,
        informational: false,
      });
    }
  }

  // ---- Glucose variability ----
  const glucoseValues = recent.map((r) => r.avg_glucose).filter((v) => Number.isFinite(v));
  if (glucoseValues.length >= 3) {
    const max = Math.max(...glucoseValues);
    const min = Math.min(...glucoseValues);

    if (max - min >= 30) {
      signals.push({
        label: "High glucose variability",
        severity: max - min >= 50 ? "high" : "medium",
        delta: max - min,
        timeSensitive: false,

        category: "glucose",
        actionable: false,
        informational: false,
      });
    }
  }

  return signals;
}
