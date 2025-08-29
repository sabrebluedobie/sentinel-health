import React, { useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
// src/pages/Settings.jsx (or wherever your Sync button lives)
import supabase from "@/lib/supabase";

async function handleSyncNow() {
  setSyncMsg("Syncing…");

  const { data: { session } } = await supabase.auth.getSession();

  await fetch("/api/nightscout/sync", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  },
  body: JSON.stringify({ sinceDays: 14 }),
});
  const token = session?.access_token;

  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) {
    setSyncMsg(`Sync failed: ${j.error || res.statusText}`);
  } else {
    setSyncMsg(`Synced ${j.inserted || 0} readings.`);
  }
}

export default function Settings() {
  const [tab, setTab] = useState("colors");
  return (
    <div style={styles.wrap}>
      <h1 style={{ marginBottom: 14 }}>Settings</h1>
      <div style={styles.tabs}>
        <Tab id="colors" tab={tab} setTab={setTab} label="Colors" />
        <Tab id="cgm" tab={tab} setTab={setTab} label="CGM" />
        <Tab id="healthkit" tab={tab} setTab={setTab} label="HealthKit" />
        <Tab id="export" tab={tab} setTab={setTab} label="Export to Provider" />
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

function Tab({ id, tab, setTab, label }) {
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
      <p>Choose a primary color.</p>
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
      if (j.url) window.location.href = j.url;
      else setStatus(j.message || "Configure CGM provider keys.");
    } catch (e) {
      console.error(e);
      setStatus("Connection failed.");
    }
  };
  try {
  const u = baseUrl.replace(/\/+$/, "") + "/api/v1/entries.json?count=1" + (token ? `&token=${encodeURIComponent(token)}` : "");
  const r = await fetch(u, { method: "GET" });
  const text = await r.text().catch(() => "");
  if (!r.ok) {
    if (r.status === 525 || text.includes("Error code 525")) {
      throw new Error("Nightscout SSL handshake failed (525). Your Nightscout host’s HTTPS/TLS is misconfigured or offline.");
    }
    throw new Error(`Nightscout test failed (${r.status}). ${text.slice(0, 180)}`);
  }
  // If we got JSON, great:
  JSON.parse(text); // throws if CF error html
  setMsg("Nightscout test OK.");
} catch (e) {
  setMsg(`Test failed: ${e.message}`);
}

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
      <ol>
        <li>Install the iOS app and sign in</li>
        <li>Grant Health permissions</li>
        <li>Data syncs to your account and appears here</li>
      </ol>
      <button style={styles.secondary} onClick={() => alert("iOS deep link coming soon")}>
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
