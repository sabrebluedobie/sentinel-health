export function mapTodToSignals(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  // expecting: [{ time_of_day: "afternoon", episode_starts: 2 }, ...]
  const top = [...rows].sort((a, b) => (b.episode_starts ?? 0) - (a.episode_starts ?? 0))[0];
  if (!top?.time_of_day) return [];

  const severity = (top.episode_starts ?? 0) >= 5 ? "high"
                 : (top.episode_starts ?? 0) >= 2 ? "medium"
                 : "low";

  return [{
    label: `High glucose episodes most often begin in the ${top.time_of_day}`,
    severity,
    delta: top.episode_starts ?? 0,
    category: "glucose",
    actionable: true,
    timeSensitive: true,
  }];
}


function formatHour(h) {
  const hour = ((h % 24) + 24) % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}${suffix}`;
}
