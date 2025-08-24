// src/components/modals/SettingsModal.jsx
// Settings + Connect CGM UI — 2025-08-22

import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import ConnectCGM from "../settings/ConnectCGM.jsx"; // NEW
import supabase from "@/lib/supabase";

// (Optional) keep your chart/theme settings from earlier:
function getLS(key, fallback) {
  const v = localStorage.getItem(key);
  return v == null ? fallback : v;
}

export default function SettingsModal({ onClose }) {
  // THEME + CHART COLORS (keep what you had before)
  const [bgMode, setBgMode] = useState(getLS("app.theme.bg", "blue"));
  const [fontScale, setFontScale] = useState(parseFloat(getLS("app.theme.fontScale", "1")));
  const [contrast, setContrast] = useState(getLS("app.theme.contrast", "normal"));

  const [colorMigraineLine, setColorMigraineLine] = useState(getLS("app.color.line.migraine", "#dc2626"));
  const [colorGlucoseLine, setColorGlucoseLine] = useState(getLS("app.color.line.glucose", "#2563eb"));
  const [colorSleepLine, setColorSleepLine] = useState(getLS("app.color.line.sleep", "#16a34a"));

  const [symptomColorText, setSymptomColorText] = useState(() => {
    try {
      const obj = JSON.parse(getLS("app.pieSymptomColors", "{}"));
      return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join("\n");
    } catch { return ""; }
  });

  const [realtimeOn, setRealtimeOn] = useState(getLS("app.realtimeOn", "true") !== "false");

  // Save UI prefs
  function savePrefs() {
    localStorage.setItem("app.theme.bg", bgMode);
    localStorage.setItem("app.theme.fontScale", String(fontScale));
    localStorage.setItem("app.theme.contrast", contrast);

    localStorage.setItem("app.color.line.migraine", colorMigraineLine);
    localStorage.setItem("app.color.line.glucose", colorGlucoseLine);
    localStorage.setItem("app.color.line.sleep", colorSleepLine);
    localStorage.setItem("app.realtimeOn", realtimeOn ? "true" : "false");

    const map = {};
    symptomColorText.split(/\n+/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [k, v] = line.split("=");
      if (k && v) map[k.trim()] = v.trim();
    });
    localStorage.setItem("app.pieSymptomColors", JSON.stringify(map));

    // Tell Dashboard to re-apply theme/colors
    window.dispatchEvent(new Event("settings-updated"));
  }

  const handleClose = () => {
    savePrefs();
    onClose?.();
  };

  // grab current user id (for ConnectCGM section)
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  return (
    <Modal onClose={handleClose}>
      <h3 style={{ marginBottom: 12 }}>Settings</h3>

      {/* Theme */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          Background
          <select value={bgMode} onChange={(e) => setBgMode(e.target.value)}>
            <option value="blue">Blue</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label>
          Contrast
          <select value={contrast} onChange={(e) => setContrast(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>

        <label style={{ gridColumn: "1 / -1" }}>
          Font size
          <input
            type="range"
            min="0.9"
            max="1.2"
            step="0.05"
            value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: 12, color: "#475569" }}>{Math.round(fontScale * 100)}%</div>
        </label>
      </div>

      {/* Chart colors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
        <label>
          Migraine line
          <input type="color" value={colorMigraineLine} onChange={(e) => setColorMigraineLine(e.target.value)} />
        </label>
        <label>
          Blood sugar line
          <input type="color" value={colorGlucoseLine} onChange={(e) => setColorGlucoseLine(e.target.value)} />
        </label>
        <label>
          Sleep line
          <input type="color" value={colorSleepLine} onChange={(e) => setColorSleepLine(e.target.value)} />
        </label>
      </div>

      {/* Pie color map */}
      <label style={{ display: "block", marginTop: 12 }}>
        Pie symptom colors (NAME=#hex per line)
        <textarea
          rows={4}
          value={symptomColorText}
          onChange={(e) => setSymptomColorText(e.target.value)}
          style={{ width: "100%" }}
          placeholder="Nausea=#ff5a5f&#10;Photophobia=#3b82f6"
        />
      </label>

      {/* Realtime toggle */}
      <label style={{ display: "block", marginTop: 10 }}>
        <input type="checkbox" checked={realtimeOn} onChange={(e) => setRealtimeOn(e.target.checked)} /> Realtime updates
      </label>

      {/* Divider */}
      <hr style={{ margin: "16px 0", border: 0, borderTop: "1px solid #e5e7eb" }} />

      {/* ===== NEW: Connect CGM ===== */}
      <ConnectCGM userId={userId} />

      {/* Footer */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={handleClose} style={{ padding: "8px 12px" }}>Close</button>
      </div>
    </Modal>
  );
}
