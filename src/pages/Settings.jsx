// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");

  // Load existing connection for the signed-in user
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("nightscout_connections")
          .select("url, token, api_secret, updated_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) console.warn("[Settings] load conn error:", error);
        if (data) {
          setUrl(data.url ?? "");
          setToken(data.token ?? "");
          setSecret(data.api_secret ?? "");
          setUpdatedAt(data.updated_at ?? null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    return jwt ? { Authorization: `Bearer ${jwt}` } : {};
  }

  function parseResponse(res) {
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json")
      ? res.json()
      : res.text().then(t => ({ ok: false, error: t.slice(0, 400) }));
  }

  async function onSave() {
    setBusy(true);
    setSaveMsg("Saving…");
    setTestMsg("");
    setSyncMsg("");
    try {
      const res = await fetch("/api/nightscout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          url: url.trim(),
          token: token.trim() || null,
          api_secret: secret.trim() || null,
        }),
      });
      const payload = await parseResponse(res);
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || res.statusText);
      setUpdatedAt(new Date().toISOString());
      setSaveMsg("Nightscout connection saved.");
    } catch (e) {
      setSaveMsg(`Save failed: ${e.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setTestMsg("Testing…");
    setSyncMsg("");
    try {
      const res = await fetch("/api/nightscout/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          url: url.trim(),
          token: token.trim() || null,
          api_secret: secret.trim() || null,
        }),
      });
      const payload = await parseResponse(res);
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || res.statusText);

      const latest = payload.latest
        ? `${payload.latest.dateString || payload.latest.date} — ${payload.latest.sgv} mg/dL (${payload.latest.direction || "-"})`
        : "no recent entries";
      setTestMsg(`Connected ✓ latest: ${latest}`);
    } catch (e) {
      setTestMsg(`Test failed: ${e.message || String(e)}`);
    }
  }

  async function onSync() {
    setSyncMsg("Syncing…");
    try {
      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ sinceDays: 14 }),
      });
      const payload = await parseResponse(res);
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || res.statusText);
      setSyncMsg(`Synced ${payload?.inserted ?? 0} readings.`);
    } catch (e) {
      setSyncMsg(`Sync failed: ${e.message || String(e)}`);
    }
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Nightscout</h2>
        <div className="muted" style={{ marginTop: 4 }}>
          Enter either a <b>Token</b> (preferred) or your <b>API_SECRET</b>. Leave the other blank.
        </div>

        <label className="label" style={{ marginTop: 12 }}>Nightscout URL</label>
        <input
          className="input"
          placeholder="https://yourname.nightscout.site"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          autoComplete="url"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
          <div>
            <label className="label">Token (optional)</label>
            <input
              className="input"
              placeholder="e.g. read:entries-abcdef…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">API_SECRET (optional)</label>
            <input
              className="input"
              placeholder="leave blank if using token"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn" onClick={onSave} disabled={busy}>Save connection</button>
          <button className="btn" onClick={onTest} disabled={busy || !url}>Test connection</button>
          <button className="btn" onClick={onSync} disabled={busy}>Sync now</button>
        </div>

        {!!saveMsg && <div style={{ marginTop: 8 }}>{saveMsg}</div>}
        {!!testMsg && <div style={{ marginTop: 4 }}>{testMsg}</div>}
        {!!syncMsg && <div style={{ marginTop: 4 }}>{syncMsg}</div>}
        {updatedAt && (
          <div className="muted" style={{ marginTop: 6 }}>
            Last saved: {new Date(updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
