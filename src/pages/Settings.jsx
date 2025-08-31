import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [status, setStatus] = useState("Loading…");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function getHeaders() {
    const { data } = await supabase.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) throw new Error("Not signed in.");
    return {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    };
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const uid = s?.session?.user?.id;
        if (!uid) return setStatus("Not signed in.");

        const { data, error } = await supabase
          .from("nightscout_connections")
          .select("url, token, api_secret")
          .eq("user_id", uid)
          .maybeSingle();

        if (!mounted) return;
        if (error) setStatus("Error loading connection");
        else {
          setUrl(data?.url || "");
          setToken(data?.token || "");
          setApiSecret(data?.api_secret || "");
          setStatus(data?.url ? "Connected" : "Not connected");
        }
      } catch (e) {
        if (mounted) setStatus(String(e.message || e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function callApi(path, body) {
    const headers = await getHeaders();
    const res = await fetch(path, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch {}
    if (!res.ok || (json && json.ok === false)) {
      const msg = json?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json || {};
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error("Enter a valid Nightscout URL (starts with http/https).");
      await callApi("/api/nightscout/save", { url, token, api_secret: apiSecret });
      setStatus("Connected");
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(`Save failed: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true); setMsg("");
    try {
      await callApi("/api/nightscout/test");
      setMsg("Nightscout OK ✓");
    } catch (e) {
      setMsg(`Test failed: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true); setMsg("");
    try {
      const r = await callApi("/api/nightscout/sync", { sinceDays: 14 });
      setMsg(`Synced: ${r?.inserted ?? 0} entries ✓`);
    } catch (e) {
      setMsg(`Sync failed: ${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Settings</h1>
      <p>Status: <strong>{status}</strong></p>

      <form onSubmit={save} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <label>
          Nightscout URL
          <input type="url" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://your-ns.example.com" required />
        </label>
        <label>
          Token (optional)
          <input type="text" value={token} onChange={(e)=>setToken(e.target.value)} />
        </label>
        <label>
          API Secret (optional)
          <input type="password" value={apiSecret} onChange={(e)=>setApiSecret(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy}>{busy ? "Working…" : "Save"}</button>
          <button type="button" onClick={test} disabled={busy}>Test</button>
          <button type="button" onClick={sync} disabled={busy}>Sync</button>
        </div>

        <div style={{ minHeight: 20, color: msg.includes("✓") ? "green" : "crimson" }}>{msg}</div>
      </form>
    </main>
  );
}
