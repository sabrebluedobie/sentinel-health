// src/lib/theme.js
const KEY = "theme"; // 'system' | 'light' | 'dark'

export function getSavedTheme() {
  if (typeof window === "undefined") return "system";
  return localStorage.getItem(KEY) || "system";
}

export function setTheme(mode, { save = true } = {}) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (mode === "light") {
    root.setAttribute("data-theme", "light");
  } else if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    // system: remove the attribute and let media query decide
    root.removeAttribute("data-theme");
    mode = "system";
  }

  if (save && typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, mode);
  }
}

export function applySavedTheme() {
  const m = getSavedTheme();
  setTheme(m, { save: false });
}
