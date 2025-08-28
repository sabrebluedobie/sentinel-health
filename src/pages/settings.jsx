// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { getSavedTheme, setTheme } from "@/lib/theme";

export default function Settings() {
  const [mode, setMode] = useState("system");

  useEffect(() => {
    setMode(getSavedTheme());
  }, []);

  function change(m) {
    setMode(m);
    setTheme(m);
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Appearance</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Choose how Sentinel Health looks. “System” follows your device preference automatically.
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <label style={rowStyle}>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={mode === "system"}
              onChange={() => change("system")}
            />
            <span>System</span>
          </label>

          <label style={rowStyle}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={mode === "light"}
              onChange={() => change("light")}
            />
            <span>Light</span>
          </label>

          <label style={rowStyle}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={mode === "dark"}
              onChange={() => change("dark")}
            />
            <span>Dark (Night mode)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  border: "1px solid var(--border, #eee)",
  borderRadius: 10,
  background: "var(--card, #fff)",
};
