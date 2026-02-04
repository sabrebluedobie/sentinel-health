export function mapTodToSignals(todRows) {
  if (!Array.isArray(todRows) || todRows.length === 0) return [];

  // Find peak hour
  const top = [...todRows].sort((a, b) => (b.episode_starts ?? 0) - (a.episode_starts ?? 0))[0];
  if (!top || !Number.isFinite(top.episode_starts)) return [];

  const hour = top.hour_of_day;
  const count = top.episode_starts;

  // Severity heuristic (tweak whenever)
  const severity = count >= 4 ? "high" : count >= 2 ? "medium" : "low";

  return [{
    label: `High glucose episodes most often start around ${formatHour(hour)}`,
    severity,
    delta: count,              // “how many starts” in window
    actionable: true,          // helps Priority mode
    timeSensitive: true,       // helps Risk mode
    informational: false,
  }];
}

function formatHour(h) {
  const hour = ((h % 24) + 24) % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}${suffix}`;
}
