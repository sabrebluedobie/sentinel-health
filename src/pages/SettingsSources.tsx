import React, { useState } from "react";

export default function SettingsSources() {
  const [mode, setMode] = useState<"cgm" | "manual">("manual");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${mode === "cgm" ? "btn-primary" : ""}`} onClick={() => setMode("cgm")}>
          Connect CGM
        </button>
        <button className={`btn ${mode === "manual" ? "btn-primary" : ""}`} onClick={() => setMode("manual")}>
          Manual entry
        </button>
      </div>

      {mode === "cgm" ? <CGMConnectPanel /> : <ManualEntryHelp />}
    </div>
  );
}

function CGMConnectPanel() {
  // Slot to mount Dexcom/Libre OAuth or your API proxy flows
  return (
    <div>
      <p className="muted">Connect your continuous glucose monitor (Dexcom, Libre, etc.).</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled>
          Connect Dexcom (coming soon)
        </button>
        <button className="btn" disabled>
          Connect Libre (coming soon)
        </button>
      </div>
    </div>
  );
}

function ManualEntryHelp() {
  return <p className="muted">Manual mode enabled. Use “Log glucose” on the Dashboard to add readings.</p>;
}
