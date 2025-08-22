// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

export const BRAND = {
  primary: localStorage.getItem("app.themeColor") || "#042d4d",
  good: "#16a34a",
  warn: "#f59e0b",
  bad: "#dc2626",
  info: "#2563eb",
  violet: "#7c3aed",
};
export const DEFAULT_CHART_COLORS = [
  BRAND.primary, BRAND.bad, BRAND.good, BRAND.info, BRAND.violet, BRAND.warn, "#0ea5e9", "#f97316",
];
export const PALETTES = {
  default: DEFAULT_CHART_COLORS,
  pastel: ["#8ecae6","#219ebc","#ffb703","#fb8500","#90be6d","#577590","#e5989b","#6a4c93"],
  bold: ["#1f2937","#ef4444","#10b981","#2563eb","#7c3aed","#f59e0b","#0ea5e9","#f97316"],
};
export function getCurrentPalette() {
  const name = localStorage.getItem("app.chartPalette") || "default";
  return PALETTES[name] || DEFAULT_CHART_COLORS;
}
export function getChartLineColor(key, fallback) {
  const v = localStorage.getItem(key);
  return v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : fallback;
}
export function getPieSymptomColorMap() {
  try { const raw = localStorage.getItem("app.pieSymptomColors"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
