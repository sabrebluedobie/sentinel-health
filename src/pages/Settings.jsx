// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [nightMode, setNightMode] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const [saveMsg, setSaveMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Load previously saved Nightscout connection (optional convenience)
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      if (!user_id) return;
      const { data, error } = await supabase
        .from("nightscout_connections")
        .select("url, token, api_secret")
        .eq("user_id", user_id)
        .maybeSingle();
      if (!cancel && data && !error) {
        setUrl(data.url || "");
        setToken(data.token || "");
        setApiSecret(data.api_secret || "");
      }
    })();
    return () => { cancel = true; };
  }, []);

  function normalizeUrl(u) {
    if (!u) return "";
    let s = u.trim();
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    return s.replace(/\/+$/, ""); // remove trailing slash
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveMsg("");
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error("Not signed in.");

      // Save via RPC if you created it, otherwise plain upsert
      // 1) RPC path (preferred if you added set_nightscout_connection):
      try {
        const { error: rpcErr } = await supabase.rpc("set_nightscout_connection", {
          p_url: normalizeUrl(url),
          p_token: token || null,
          p_api_secret: apiSecret || null
        });
        if (rpcErr) throw rpcErr;
      } catch {
        // 2) Fallback to upsert:
        const { error } = await supabase.from("nightscout_connections").upsert({
          user_id: uid,
          url: normalizeUrl(url),
          token: token || null,
          api_secret: apiSecret || null,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        if (error) throw error;
      }

      setSaveMsg("Nightscout connection saved.");
    } catch (err) {
      setSaveMsg(`Save failed: ${err.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setTestMsg("Testing…");
    try {
      const res = await fetch("/api/nightscout/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizeUrl(url),
          token: token || null,
          api_secret: apiSecret || null,
          count: 3
        })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Test failed");
      const sample = j.sample?.[0];
      if (sample) {
        setTestMsg(
          `Connected ✓  latest: ${sample.time_local} — ${sample.sgv} mg/dL (${sample.direction || "—"})`
        );
      } else {
        setTestMsg("Connected ✓ but no entries returned.");
      }
    } catch (e) {
      setTestMsg(`Test failed: ${e.message || String(e)}`);
    }
  }

  async function handleSyncNow() {
    setSyncMsg("Syncing…");
    try {
      // Optional: include current user access token (good for future auth checks on server)
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;

      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          // If you omit these, the function can choose to look up saved connection by user_id
          url: normalizeUrl(url),
          token: token || null,
          api_secret: apiSecret || null,
          // optionally control how many recent entries to pull:
          count: 200
        })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Sync failed");
      setSyncMsg(`Sync complete ✓ inserted: ${j.inserted}, skipped: ${j.skipped}`);
    } catch (e) {
      setSyncMsg(`Sync failed: ${e.message || String(e)}`);
    }
  }

  // Night mode toggle → persist to localStorage (simple, optional)
  useEffect(() => {
    const stored = localStorage.getItem("nightMode");
    if (stored) setNightMode(stored === "true");
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = nightMode ? "dark" : "light";
    localStorage.setItem("nightMode", String(nightMode));
  }, [nightMode]);

  return (
    <div className="container" style={{ padding: 16, maxWidth: 720 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      {/* Theme */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Appearance</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={nightMode}
            onChange={(e) => setNightMode(e.target.checked)}
          />
          Enable night mode (dark theme)
        </label>
      </div>

      {/* Nightscout */}
      <form onSubmit={handleSave} className="card" style={{ padding: 16, borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Nightscout</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Enter your Nightscout URL and either a scoped <strong>token</strong> (recommended) or your
          <strong> API_SECRET</strong>.
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          <input
            type="url"
            placeholder="https://your-nightscout.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Token (recommended, leave blank if using API_SECRET)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <input
            type="password"
            placeholder="API_SECRET (leave blank if using token)"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="submit" disabled={busy} className="btn">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={handleTest} className="btn secondary">
            Test connection
          </button>
          <button type="button" onClick={handleSyncNow} className="btn secondary">
            Sync now
          </button>
        </div>

        <div style={{ marginTop: 8, minHeight: 20 }}>
          {saveMsg && <div className="muted">{saveMsg}</div>}
          {testMsg && <div className="muted">{testMsg}</div>}
          {syncMsg && <div className="muted">{syncMsg}</div>}
        </div>
      </form>
    </div>
  );
}
