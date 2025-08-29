// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  // Nightscout connection form
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Manual sync
  const [days, setDays] = useState(3);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Load existing connection (optional, best effort)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("nightscout_connections")
        .select("url, token, api_secret")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setUrl(data.url || "");
        setToken(data.token || "");
        setApiSecret(data.api_secret || "");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveNightscout(e) {
    e.preventDefault();
    setSaveMsg("");
    setSaving(true);
    const { error } = await supabase.rpc("set_nightscout_connection", {
      p_url: url.trim(),
      p_token: token || null,
      p_api_secret: apiSecret || null,
    });
    setSaving(false);
    setSaveMsg(error ? `Error: ${error.message}` : "Nightscout connection saved.");
  }

  async function manualSync() {
    setSyncMsg("");
    setSyncing(true);
    // Use the user's JWT to authenticate our /api/nightscout/pull call
    const { data: { session } } = await supabase.auth.getSession();
    const access = session?.access_token;
    if (!access) {
      setSyncing(false);
      setSyncMsg("You must be signed in.");
      return;
    }
    try {
      const r = await fetch(`/api/nightscout/pull?days=${days}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setSyncMsg(`Pulled ${json.fetched} entries — inserted ${json.inserted}, skipped ${json.skipped}.`);
    } catch (e) {
      setSyncMsg(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      {/* Nightscout connection */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Nightscout</h2>
        <form onSubmit={saveNightscout} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          <label>
            <div className="muted" style={{ marginBottom: 4 }}>Nightscout URL</div>
            <input
              type="url"
              required
              placeholder="https://my-nightscout.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            <div className="muted" style={{ marginBottom: 4 }}>Token (optional)</div>
            <input
              type="text"
              placeholder="If your site uses tokens"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            <div className="muted" style={{ marginBottom: 4 }}>API Secret (optional)</div>
            <input
              type="password"
              placeholder="If your site uses API secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? "Saving…" : "Save connection"}
          </button>
          {saveMsg && <div className="muted">{saveMsg}</div>}
        </form>
      </div>

      {/* Manual Nightscout sync */}
      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Manual Nightscout Sync</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            <span className="muted" style={{ marginRight: 8 }}>Range:</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={inputStyle}>
              <option value={1}>Last 24 hours</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
          <button onClick={manualSync} disabled={syncing} style={primaryBtn}>
            {syncing ? "Syncing…" : "Pull now"}
          </button>
        </div>
        {syncMsg && <div className="muted" style={{ marginTop: 8 }}>{syncMsg}</div>}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};

const primaryBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--primary, #1a73e8)",
  background: "var(--primary, #1a73e8)",
  color: "#fff",
  cursor: "pointer",
};
