"use client";
import React, { useState, useContext } from "react";
import { ThemeContext } from "../src/components/ThemeContext";

export default function SettingsPage() {
  const [tab, setTab] = useState("colors");
  return (
    <div style={styles.wrap}>
      <h1 style={{ marginBottom: 14 }}>Settings</h1>

      <div style={styles.tabs}>
        <TabButton id="colors" tab={tab} setTab={setTab} label="Colors" />
        <TabButton id="cgm" tab={tab} setTab={setTab} label="CGM" />
        <TabButton id="healthkit" tab={tab} setTab={setTab} label="HealthKit" />
        <TabButton id="export" tab={tab} setTab={setTab} label="Export to Provider" />
      </div>

      <div style={styles.panel}>
        {tab === "colors" && <ColorsPanel />}
        {tab === "cgm" && <CgmPanel />}
        {tab === "healthkit" && <HealthKitPanel />}
        {tab === "export" && <ExportPanel />}
      </div>
    </div>
  );
}

function TabButton({ id, tab, setTab, label }) {
  const active = tab === id;
  return (
    <button onClick={() => setTab(id)} style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>
      {label}
    </button>
  );
}

function ColorsPanel() {
  const { primary, setPrimary } = useContext(ThemeContext);
  const [val, setVal] = useState(primary);

  return (
    <section>
      <h3>Theme Colors</h3>
      <p>Choose a primary color for buttons and highlights.</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <input type="color" value={val} onChange={(e) => setVal(e.target.value)} />
        <button style={styles.save} onClick={() => setPrimary(val)}>Save</button>
      </div>
    </section>
  );
}

function CgmPanel() {
  const [status, setStatus] = useState("");
  const connect = async () => {
    setStatus("Connecting…");
    try {
      const r = await fetch("/api/cgm/connect", { method: "POST" });
      const j = await r.json();
      if (j.url) {
        window.location.href = j.url; // redirect to your CGM OAuth / aggregator flow
      } else {
        setStatus(j.message || "Ready. Configure CGM provider keys.");
      }
    } catch (e) {
      console.error(e);
      setStatus("Connection failed.");
    }
  };
  return (
    <section>
      <h3>Connect CGM</h3>
      <p>Link your continuous glucose monitor account.</p>
      <button style={styles.primary} onClick={connect}>Connect CGM</button>
      <div style={{ marginTop: 8, color: "#666" }}>{status}</div>
    </section>
  );
}

function HealthKitPanel() {
  return (
    <section>
      <h3>Connect Apple Health (HealthKit)</h3>
      <p>
        Apple Health connects via the iOS app. Install the app and sign in, then authorize HealthKit.
        From this web app we’ll show your connection status after the device syncs.
      </p>
      <ol>
        <li>Install the iOS app (coming soon)</li>
        <li>Open the app → grant Health permissions</li>
        <li>Data will sync to your account and appear here</li>
      </ol>
      <button style={styles.secondary} onClick={() => alert("iOS app deep link coming soon")}>
        Open iOS App
      </button>
    </section>
  );
}

function ExportPanel() {
  const [userId, setUserId] = useState("");
  const download = () => {
    if (!userId) return alert("Enter User ID");
    window.open(`/api/export/health-provider?user_id=${encodeURIComponent(userId)}`, "_blank");
  };

  return (
    <section>
      <h3>Export to Health Provider</h3>
      <p>Download a CSV you can upload to your provider’s portal or share securely.</p>
      <input
        placeholder="User ID (UUID)"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={styles.input}
      />
      <button style={styles.primary} onClick={download}>Download CSV</button>
    </section>
  );
}

const styles = {
  wrap: { maxWidth: 900, margin: "24px auto", padding: "0 16px" },
  tabs: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  tab: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fafafa", cursor: "pointer" },
  tabActive: { background: "#fff", borderColor: "#999", fontWeight: 600 },
  panel: { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" },
  input: { display: "block", margin: "10px 0 12px", padding: "8px 10px", width: "100%", maxWidth: 360, borderRadius: 8, border: "1px solid #ddd" },
  primary: { padding: "8px 12px", borderRadius: 10, border: "1px solid #1a73e8", background: "#1a73e8", color: "#fff", cursor: "pointer" },
  secondary: { padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#f6f6f6", cursor: "pointer" },
  save: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }
};
