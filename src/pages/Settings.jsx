// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function Settings() {
  // Nightscout form state
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgKind, setMsgKind] = useState("info"); // 'info' | 'ok' | 'err'

  // Theme toggle
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  // Apply theme immediately on mount & when changed
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Prefill Nightscout values if the row already exists
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setMsg("");
        // RLS policy allows the authed user to read their single row
        const { data, error } = await supabase
          .from("nightscout_connections")
          .select("url, token, api_secret")
          .maybeSingle();
        if (error) throw error;
        if (!cancel && data) {
          setUrl(data.url || "");
          setToken(data.token || "");
          setApiSecret(data.api_secret || "");
        }
      } catch (e) {
        if (!cancel) {
          setMsgKind("err");
          setMsg(e.message || "Failed to load Nightscout connection");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  function validUrl(u) {
    try {
      const x = new URL(u);
      return x.protocol === "https:" || x.protocol === "http:";
    } catch {
      return false;
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setMsg("");
    setMsgKind("info");

    if (!validUrl(url)) {
      setMsgKind("err");
      setMsg("Please enter a valid http(s) Nightscout URL.");
      return;
    }

    setBusy(true);
    try {
      // <-- This is the “quick client call reminder”, wired into the form.
      const { data, error } = await supabase.rpc("set_nightscout_connection", {
        p_api_secret: apiSecret || null,
        p_token: token || null,
        p_url: url,
      });
      if (error) throw error;

      setMsgKind("ok");
      setMsg("Nightscout connection saved.");
    } catch (e) {
      setMsgKind("err");
      setMsg(e.message || "Failed to save Nightscout connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Settings</h1>

      {/* Theme */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Appearance</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === "light"}
              onChange={() => setTheme("light")}
            />
            Light
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === "dark"}
              onChange={() => setTheme("dark")}
            />
            Dark
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === "system"}
              onChange={() => setTheme("system")}
            />
            System
          </label>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Tip: make sure your CSS uses <code>[data-theme="dark"]</code> rules or CSS variables to style dark mode.
        </p>
      </div>

      {/* Nightscout */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Nightscout Pro</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Enter your Nightscout site URL and (optionally) a token or API secret.
        </p>

        <form onSubmit={handleSave} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nightscout URL</span>
            <input
              type="url"
              placeholder="https://your-nightscout.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoComplete="url"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Token (optional)</span>
            <input
              type="text"
              placeholder="e.g. my_read_token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>API Secret (optional)</span>
            <input
              type="password"
              placeholder="••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            {msg && (
              <div
                style={{
                  alignSelf: "center",
                  color: msgKind === "err" ? "#b91c1c" : msgKind === "ok" ? "#166534" : "#555",
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};
