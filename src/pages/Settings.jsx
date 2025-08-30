import React, { useState } from "react";
import SettingsSources from "./SettingsSources";
import PieColorsEditor from "@/components/charts/PieColorsEditor";

export default function Settings() {
  const [tab, setTab] = useState("appearance"); // "appearance" | "sources"

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${tab === "appearance" ? "btn-primary" : ""}`} onClick={() => setTab("appearance")}>
          Appearance
        </button>
        <button className={`btn ${tab === "sources" ? "btn-primary" : ""}`} onClick={() => setTab("sources")}>
          Data sources
        </button>
      </div>

      {tab === "appearance" && (
        <div className="card" style={{ padding: 16, borderRadius: 14 }}>
          <h2 style={{ margin: 0 }}>Pie slice colors (Migraine symptoms)</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            Customize symptom → color. Saved to local storage and applied to the dashboard pie.
          </div>
          <div style={{ marginTop: 12 }}>
            <PieColorsEditor storageKey="app.pieSymptomColors" />
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="card" style={{ padding: 16, borderRadius: 14 }}>
          <h2 style={{ margin: 0 }}>Connect glucose</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            Connect a CGM (Dexcom, Libre) or switch to manual entry.
          </div>
          <div style={{ marginTop: 12 }}>
            <SettingsSources />
          </div>
        </div>
      )}
    </div>
  );
}
