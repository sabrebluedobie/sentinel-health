// src/components/modals/SettingsModal.jsx
// Settings with tabs (Preferences / CGM / About) + "Sync Now" under CGM
// 2025-08-23

import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import ConnectCGM from "../settings/ConnectCGM.jsx"; // keep using your existing component
import supabase from "../../services/supabaseClient.js";
import { syncNightscoutNow } from "../../services/syncNow.js"; // NEW

// (Optional) helpers you already had
function getLS(key, fallback) {
  const v = localStorage.getItem(key);
  return v == null ? fallback : v;
}

export default function SettingsModal({ onClose }) {
  // ---- Tabs ----
  const [tab, setTab] = useState("prefs"); // 'prefs' | 'cgm' | 'about'

  // ---- THEME + CHART COLORS (Preferences tab) ----
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
    } catch {
      return "";
    }
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
    symptomColorText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [k, v] = line.split("=");
        if (k && v) map[k.trim()] = v.trim();
      });
    localStorage.setItem("app.pieSymptomColors", JSON.stringify(map));

    // Tell Dashboard to re-apply theme/colors
    window.dispatchEvent(new Event("settings-updated"));
  }

  const handleClose = () => {
    // Only preferences are local; CGM settings are saved through ConnectCGM
    savePrefs();
    onClose?.();
  };

  // Current user id (handed to ConnectCGM)
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  // --- Small styles (works with or without Tailwind) ---
  const tabBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid " + (tab === id ? "#0ea5e9" : "#e5e7eb"),
        background: tab === id ? "rgba(14,165,233,0.08)" : "#fff",
        color: "#0f172a",
        fontWeight: tab === id ? 700 : 600,
      }}
    >
      {label}
    </button>
  );

  return (
    <Modal onClose={handleClose}>
      <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Settings</h3>

      {/* Tabs header */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {tabBtn("prefs", "Preferences")}
        {tabBtn("cgm", "CGM")}
        {tabBtn("about", "About")}
      </div>

      {/* Tab content */}
      {tab === "prefs" && (
        <div>
          {/* Theme */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Background
              <select value={bgMode} onChange={(e) => setBgMode(e.target.value)} style={{ display: "block", width: "100%" }}>
                <option value="blue">Blue</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label>
              Contrast
              <select value={contrast} onChange={(e) => setContrast(e.target.value)} style={{ display: "block", width: "100%" }}>
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
        </div>
      )}

      {tab === "cgm" && (
        <div>
          {/* Your existing connection form/component */}
          <ConnectCGM userId={userId} />

          {/* Divider */}
          <hr style={{ margin: "16px 0", border: 0, borderTop: "1px solid #e5e7eb" }} />

          {/* Sync Now button + feedback */}
          <CGMSyncBlock />
        </div>
      )}

      {tab === "about" && (
        <div>
          <p style={{ color: "#334155", lineHeight: 1.5, marginBottom: 8 }}>
            Sentinel Health lets you track migraines, blood sugar, and sleep in one place. CGM syncing uses your own token +
            URL stored securely in your account. Data is siloed by user via Supabase Row-Level Security.
          </p>
          <ul style={{ marginLeft: 18 }}>
            <li>Version: {import.meta.env?.VITE_APP_VERSION || "dev"}</li>
            <li>Charts: lightweight custom with Tailwind</li>
          </ul>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={handleClose} style={{ padding: "8px 12px" }}>
          Close
        </button>
      </div>
    </Modal>
  );
}

/** Little block that shows a "Sync Now" button and a last-result message. */
function CGMSyncBlock() {
  const [busy, setBusy] = useState(false);
  const [lastMsg, setLastMsg] = useState("");

  const run = async () => {
    setBusy(true);
    setLastMsg("");
    try {
      const res = await syncNightscoutNow();
      if (res?.error) {
        setLastMsg(`Sync failed: ${res.error}`);
      } else if (res?.reason === "no-connection") {
        setLastMsg("No Nightscout connection set yet.");
      } else {
        setLastMsg(`Synced ${res.inserted ?? 0} rows.`);
      }
    } catch (e) {
      setLastMsg((e && e.message) || "Sync error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={run}
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            background: busy ? "#93c5fd" : "#2563eb",
            color: "#fff",
            border: "1px solid #1d4ed8",
          }}
        >
          {busy ? "Syncing…" : "Sync Now"}
        </button>
        {lastMsg && <span style={{ fontSize: 13, color: "#334155" }}>{lastMsg}</span>}
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        Pulls your latest readings from Nightscout into Sentinel. You can close this after syncing.
      </p>
    </div>
  );
}