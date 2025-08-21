// src/lib/timeUtils.js

/** Convert UTC ISO + stored offset (minutes east of UTC) to local wall clock Date */
export function applyOffset(utcIso, offsetMin) {
  if (!utcIso) return null;
  const utcMs = new Date(utcIso).getTime();
  const localMs = utcMs + (offsetMin || 0) * 60_000;
  return new Date(localMs);
}

/** Nicely formatted string (local time as entered by user) */
export function formatLocalAtEntry(utcIso, offsetMin, opts = {}) {
  const d = applyOffset(utcIso, offsetMin);
  if (!d) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...opts,
  });
}