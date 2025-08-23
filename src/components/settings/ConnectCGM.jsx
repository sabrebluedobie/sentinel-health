// src/components/settings/ConnectCGM.jsx
// One-stop UI to connect Dexcom, Nightscout, and guide Apple/Android
// 2025-08-22 — ConnectCGM refresh with RAW token -> SHA-1 helper

import React, { useEffect, useState } from "react";
import {
  getConnections,
  upsertNightscout,
  pullNightscoutNow,
  disconnectProvider,
  startDexcomOAuth,
} from "../../services/cgm.js";

// --- Small UI helpers ---
function Badge({ ok, text }) {
  const bg = ok ? "#dcfce7" : "#fee2e2";
  const fg = ok ? "#166534" : "#991b1b";
  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

// SHA-1 hex using Web Crypto
async function sha1Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ConnectCGM({ userId }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // connection map like { dexcom: true/false, nightscout: true/false }
  const [conns, setConns] = useState({});

  // Nightscout inputs
  const [nsUrl, setNsUrl] = useState("");
  const [nsTokenRaw, setNsTokenRaw] = useState(""); // human-readable Access Token from Admin -> Access Tokens
  const [nsTokenSha1, setNsTokenSha1] = useState(""); // derived for uploader env
  const [copied, setCopied] = useState(false);

  async function refresh() {
    if (!userId) return;
    setLoading(true);
    try {
      const map = await getConnections(userId);
      setConns(map || {});
    } catch (e) {
      console.warn("getConnections error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  // Convert RAW token to SHA-1 (for uploader)
  async function onConvertRaw() {
    setMsg("");
    setCopied(false);
    if (!nsTokenRaw) return;
    try {
      const hex = await sha1Hex(nsTokenRaw.trim());
      setNsTokenSha1(hex);
    } catch (e) {
      setMsg("Could not convert token: " + String(e?.message || e));
    }
  }

  // Copy SHA-1 to clipboard
  async function onCopySha() {
    if (!nsTokenSha1) return;
    try {
      await navigator.clipboard.writeText(nsTokenSha1);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setMsg("Copy failed: " + String(e?.message || e));
    }
  }

  // Save Nightscout connection (stores RAW token; our server hashes when pulling)
  async function onNightscoutSave() {
    if (!userId || !nsUrl) {
      setMsg("Please provide your Nightscout URL.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await upsertNightscout(userId, nsUrl, nsTokenRaw || "");
      await refresh();
      setMsg("Nightscout connection saved.");
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Pull recent data from Nightscout into glucose_readings
  async function onNightscoutPull() {
    if (!userId || !nsUrl) {
      setMsg("Please provide your Nightscout URL.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const { inserted, message, error, details, status } = await pullNightscoutNow(
        userId,
        nsUrl,
        nsTokenRaw || ""
      );
      if (error) {
        setMsg(
          `Nightscout pull failed${status ? " (" + status + ")" : ""}: ${error}${
            details ? " — " + String(details).slice(0, 200) : ""
          }`
        );
      } else {
        setMsg(
          typeof inserted === "number"
            ? `Pulled ${inserted} entries from Nightscout.${message ? " " + message : ""}`
            : message || "Pull completed."
        );
      }
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Disconnect a provider
  async function onDisconnect(provider) {
    if (!userId) return;
    setBusy(true);
    setMsg("");
    try {
      await disconnectProvider(userId, provider);
      await refresh();
      setMsg(`${provider} disconnected.`);
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Start Dexcom OAuth
  function onDexcomConnect() {
    setMsg("");
    if (!userId) {
      setMsg("You must be signed in.");
      return;
    }
    startDexcomOAuth(userId);
  }

  return (
    <section aria-labelledby="cgm-head">
      <h4 id="cgm-head" style={{ marginBottom: 8 }}>Connect CGM</h4>

      {loading ? (
        <div style={{ fontSize: 14, color: "#475569" }}>Checking connections…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Dexcom */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Dexcom</div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Connect via Dexcom OAuth (Sandbox/Prod by env)
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge ok={!!conns.dexcom} text={conns.dexcom ? "Connected" : "Not connected"} />
                {conns.dexcom ? (
                  <button
                    disabled={busy}
                    onClick={() => onDisconnect("dexcom")}
                    style={{ padding: "8px 12px" }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    disabled={busy || !userId}
                    onClick={onDexcomConnect}
                    style={{
                      background: "#111827",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Connect Dexcom
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nightscout */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Nightscout</div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Paste your Nightscout URL & <b>Access Token (RAW)</b>.
                  We can convert it to <b>SHA-1</b> for your uploader.
                  Sentinel’s own “Sync Now” accepts RAW or SHA-1 (hashed server-side).
                </div>
              </div>
              <Badge
                ok={!!conns.nightscout}
                text={conns.nightscout ? "Connected" : "Not connected"}
              />
            </div>

            {/* URL + SHA-1 (for uploader) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              <label>
                URL
                <input
                  placeholder="https://my-nightscout.example.com"
                  value={nsUrl}
                  onChange={(e) => setNsUrl(e.target.value)}
                />
              </label>
              <label>
                SHA-1 (for uploader env)
                <input
                  placeholder="(click Convert below)"
                  value={nsTokenSha1}
                  onChange={(e) => setNsTokenSha1(e.target.value)}
                />
              </label>
            </div>

            {/* RAW token + Convert/Copy */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 8,
                marginTop: 8,
              }}
            >
              <label>
                Access Token (RAW)
                <input
                  placeholder="Nightscout Admin → Access Tokens → Token"
                  value={nsTokenRaw}
                  onChange={(e) => setNsTokenRaw(e.target.value)}
                />
              </label>
              <button onClick={onConvertRaw} style={{ padding: "8px 12px" }}>
                Convert to SHA-1
              </button>
              <button
                onClick={onCopySha}
                disabled={!nsTokenSha1}
                style={{ padding: "8px 12px" }}
                title="Copy SHA-1 to clipboard"
              >
                {copied ? "Copied!" : "Copy SHA-1"}
              </button>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={busy || !userId || !nsUrl}
                onClick={onNightscoutSave}
                style={{
                  background: "#111827",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                Save Connection
              </button>
              <button
                disabled={busy || !userId || !nsUrl}
                onClick={onNightscoutPull}
                style={{ padding: "8px 12px" }}
              >
                Sync Now
              </button>
              {conns.nightscout && (
                <button
                  disabled={busy}
                  onClick={() => onDisconnect("nightscout")}
                  style={{ padding: "8px 12px" }}
                >
                  Disconnect
                </button>
              )}
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
              <div>
                <b>Uploader tip:</b> In Heroku/Docker, set <code>NIGHTSCOUT_API_TOKEN</code> to the SHA-1 above.
              </div>
              <div>
                If Sync fails with 500, ensure Nightscout actually has data
                (the uploader must be running and pushing Libre 3 readings).
              </div>
            </div>
          </div>

          {/* Apple / Android guidance */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>Apple Health / Android Health Connect</div>
            <ul style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
              <li>Open the Sentinel <b>mobile app</b> and go to <b>Settings → Health permissions</b>.</li>
              <li>Enable <b>Blood Glucose</b> read access.</li>
              <li>Tap <b>Sync Now</b> in the mobile app to upload data to your dashboard.</li>
            </ul>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              (This path doesn’t fill Nightscout; it sends readings straight to your dashboard.)
            </div>
          </div>

          {msg && <div style={{ fontSize: 13, color: "#334155" }}>{msg}</div>}
        </div>
      )}
    </section>
  );
}