// src/components/modals/SettingsModal.jsx
import React, { useState } from "react";
import Modal from "../common/Modal.jsx";

/**
 * Minimal Settings modal:
 * - Theme color
 * - Chart palette
 * - Per-line colors (migraine/glucose/sleep)
 * - Pie colors mapping (SYMPTOM=#hex per line)
 * - Realtime toggle (just stored; your listeners can read it)
 *
 * Persists to localStorage and dispatches "settings-updated" so listeners can react.
 */
export default function SettingsModal({ onClose }) {
  const [themeColor, setThemeColor] = useState(localStorage.getItem("app.themeColor") || "#042d4d");
  const [chartPalette, setChartPalette] = useState(localStorage.getItem("app.chartPalette") || "default");
  const [colorMigraineLine, setColorMigraineLine] = useState(localStorage.getItem("app.color.line.migraine") || "#dc2626");
  const [colorGlucoseLine, setColorGlucoseLine] = useState(localStorage.getItem("app.color.line.glucose") || "#2563eb");
  const [colorSleepLine, setColorSleepLine] = useState(localStorage.getItem("app.color.line.sleep") || "#16a34a");
  const [realtimeOn, setRealtimeOn] = useState(localStorage.getItem("app.realtimeOn") !== "false");

  const [symptomColorText, setSymptomColorText] = useState(() => {
    try {
      const obj = JSON.parse(localStorage.getItem("app.pieSymptomColors") || "{}");
      return Object.entries(obj)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
    } catch {
      return "";
    }
  });

  function save() {
    localStorage.setItem("app.themeColor", themeColor);
    localStorage.setItem("app.chartPalette", chartPalette);
    localStorage.setItem("app.color.line.migraine", colorMigraineLine);
    localStorage.setItem("app.color.line.glucose", colorGlucoseLine);
    localStorage.setItem("app.color.line.sleep", colorSleepLine);
    localStorage.setItem("app.realtimeOn", realtimeOn ? "true" : "false");

    const map = {};
    symptomColorText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [k, v] = line.split("=");
        if (k && v) map[k.trim()] = v.trim();
      });
    localStorage.setItem("app.pieSymptomColors", JSON.stringify(map));

    window.dispatchEvent(new Event("settings-updated"));
    onClose?.();
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 8 }}>Settings</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label>
          Theme color
          <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
        </label>
        <label>
          Palette
          <select value={chartPalette} onChange={(e) => setChartPalette(e.target.value)}>
            <option value="default">Default</option>
            <option value="pastel">Pastel</option>
            <option value="bold">Bold</option>
          </select>
        </label>

        <label>
          Migraine line
          <input type="color" value={colorMigraineLine} onChange={(e) => setColorMigraineLine(e.target.value)} />
        </label>
        <label>
          Glucose line
          <input type="color" value={colorGlucoseLine} onChange={(e) => setColorGlucoseLine(e.target.value)} />
        </label>
        <label>
          Sleep line
          <input type="color" value={colorSleepLine} onChange={(e) => setColorSleepLine(e.target.value)} />
        </label>
      </div>

      <label style={{ display: "block", marginTop: 8 }}>
        Pie symptom colors (one per line, e.g. `Nausea=#ff5a5f`)
        <textarea
          rows={4}
          value={symptomColorText}
          onChange={(e) => setSymptomColorText(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginTop: 8 }}>
        <input type="checkbox" checked={realtimeOn} onChange={(e) => setRealtimeOn(e.target.checked)} /> Realtime updates
      </label>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          onClick={save}
          style={{ background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8 }}
        >
          Save
        </button>
        <button onClick={onClose} style={{ padding: "8px 12px" }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}