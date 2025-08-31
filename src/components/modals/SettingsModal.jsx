// src/components/modals/SettingsModal.jsx
import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import "../forms/form.css";

export default function SettingsModal({ open, onClose }) {
  const [themeColor, setThemeColor] = useState(localStorage.getItem("app.themeColor") || "#042d4d");
  const [chartPalette, setChartPalette] = useState(localStorage.getItem("app.chartPalette") || "default");
  const [colorMigraine, setMigraine] = useState(localStorage.getItem("app.color.line.migraine") || "#dc2626");
  const [colorGlucose, setGlucose]   = useState(localStorage.getItem("app.color.line.glucose") || "#2563eb");
  const [colorSleep, setSleep]       = useState(localStorage.getItem("app.color.line.sleep") || "#16a34a");
  const [realtime, setRealtime]      = useState(localStorage.getItem("app.realtimeOn") !== "false");

  if (!open) return null;

  function save() {
    localStorage.setItem("app.themeColor", themeColor);
    localStorage.setItem("app.chartPalette", chartPalette);
    localStorage.setItem("app.color.line.migraine", colorMigraine);
    localStorage.setItem("app.color.line.glucose", colorGlucose);
    localStorage.setItem("app.color.line.sleep", colorSleep);
    localStorage.setItem("app.realtimeOn", realtime ? "true" : "false");
    window.dispatchEvent(new Event("settings-updated"));
    onClose?.();
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Settings</h3>

      <label className="label">Theme color
        <input className="input" type="color" value={themeColor} onChange={e=>setThemeColor(e.target.value)} />
      </label>

      <label className="label">Chart palette
        <select className="input" value={chartPalette} onChange={e=>setChartPalette(e.target.value)}>
          <option value="default">Default</option>
          <option value="pastel">Pastel</option>
          <option value="bold">Bold</option>
        </select>
      </label>

      <label className="label">Migraine line color
        <input className="input" type="color" value={colorMigraine} onChange={e=>setMigraine(e.target.value)} />
      </label>

      <label className="label">Glucose line color
        <input className="input" type="color" value={colorGlucose} onChange={e=>setGlucose(e.target.value)} />
      </label>

      <label className="label">Sleep line color
        <input className="input" type="color" value={colorSleep} onChange={e=>setSleep(e.target.value)} />
      </label>

      <label className="label">
        <input type="checkbox" checked={realtime} onChange={e=>setRealtime(e.target.checked)} style={{ marginRight: 8 }} />
        Enable realtime updates
      </label>

      <div className="row">
        <button className="btn primary" onClick={save}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
