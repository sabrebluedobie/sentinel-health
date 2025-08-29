// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  // nightscout
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  // test connection state
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    // apply theme
    const apply = (t) => {
      if (t === "system") {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", t);
      }
    };
    apply(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const { data: userRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        const user = userRes?.user;
        if (!user) {
          setMsg("Please sign in to edit settings.");
          return;
        }
        const { data, error } = await supabase
          .from("nightscout_connections")
          .select("url, token, api_secret")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!cancel && data) {
          setUrl(data.url || "");
          setToken(data.token || "");
          setApiSecret(data.api_secret || "");
        }
      } catch (e) {
        console.error("[Settings] load error", e);
        if (!cancel) setMsg(e.message || "Failed to load settings");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  async function saveNightscout(e) {
    e?.preventDefault?.();
    setMsg("");
    setSaving(true);

    const u = (url || "").trim();
    if (!u) {
      setMsg("Please enter your Nightscout URL.");
      setSaving(false);
      return;
    }

    try {
      const { data: userRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = userRes?.user;
      if (!user) throw new Error("Not signed in.");

      // try RPC first
      const rpc = await supabase.rpc("set_nightscout_connection", {
        p_url: u,
        p_token: token?.trim() || null,
        p_api_secret: apiSecret?.trim() || null,
      });

      if (rpc.error) {
        const msg = (rpc.error.message || "").toLowerCase();
        if (msg.includes("not found") || msg.includes("object is gone")) {
          // fallback to upsert
          const { error: upErr } = await supabase
            .from("nightscout_connections")
            .upsert(
              { user_id: user.id, url: u, token: token || null, api_secret: apiSecret || null },
              { onConflict: "user_id" }
            );
          if (upErr) throw upErr;
        } else {
          throw rpc.error;
        }
      }

      setMsg("Saved ✓");
    } catch (e) {
      console.error("[Settings] save error", e);
      setMsg(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function testNightscout() {
    setTestMsg("");
    setTesting(true);
    try {
      const res = await fetch("/api/ns-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: (url || "").trim(),
          token: (token || "").trim() || null,
          api_secret: (apiSecret || "").trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const sample = json.sample != null ? ` latest SGV: ${json.sample}` : "";
      setTestMsg(`Connected ✓${sample}`);
    } catch (e) {
      setTestMsg(`Failed ❌ ${e.message || e}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="container" style={{ padding: 16, maxWidth: 720 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      {msg && (
        <div
          className="card"
          style={{
            border: msg.includes("Saved") ? "1px solid #86efac" : "1px solid #fca5a5",
            background: msg.includes("Saved") ? "#f0fff4" : "#fff7f7",
            padding: 10, borderRadius: 10, marginBottom: 12,
          }}
        >
          {msg}
        </div>
      )}

      {/* THEME */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Appearance</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <label className="muted">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark (night mode)</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          We remember your choice on this device.
        </div>
      </div>

      {/* NIGHTSCOUT */}
      <form onSubmit={saveNightscout} className="card" style={{ padding: 16, borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Nightscout</h2>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                <div className="muted">Nightscout URL</div>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://yourname.nightscout.pro"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                />
              </label>

              <label>
                <div className="muted">Nightscout Pro token (optional)</div>
                <input
                  type="text"
                  placeholder="nspt_xxx…"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                />
              </label>

              <label>
                <div className="muted">Classic Nightscout API Secret (optional)</div>
                <input
                  type="text"
                  placeholder="if using classic Nightscout"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                />
              </label>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--primary, #1a73e8)",
                  background: "var(--primary, #1a73e8)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                type="button"
                onClick={testNightscout}
                disabled={testing}
                className="btn"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {testing ? "Testing…" : "Test connection"}
              </button>
            </div>

            {testMsg && (
              <div
                className="muted"
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: testMsg.startsWith("Connected") ? "1px solid #86efac" : "1px solid #fca5a5",
                  background: testMsg.startsWith("Connected") ? "#f0fff4" : "#fff7f7",
                }}
              >
                {testMsg}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
