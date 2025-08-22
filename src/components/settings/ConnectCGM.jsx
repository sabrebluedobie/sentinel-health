// src/components/settings/ConnectCGM.jsx
// One-stop UI to connect Dexcom, Nightscout, and guide Apple/Android

import React, { useEffect, useState } from "react";
import { getConnections, upsertNightscout, pullNightscoutNow, disconnectProvider, startDexcomOAuth } from "../../services/cgm.js";

function Badge({ ok, text }) {
  const bg = ok ? "#dcfce7" : "#fee2e2";
  const fg = ok ? "#166534" : "#991b1b";
  return (
    <span style={{ background: bg, color: fg, borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
      {text}
    </span>
  );
}

export default function ConnectCGM({ userId }) {
  const [loading, setLoading] = useState(true);
  const [conns, setConns] = useState({}); // {provider: status}
  const [nsUrl, setNsUrl] = useState("");
  const [nsToken, setNsToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    if (!userId) return;
    setLoading(true);
    const map = await getConnections(userId);
    setConns(map);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [userId]);

  async function onNightscoutSave() {
    if (!userId || !nsUrl) return;
    setBusy(true); setMsg("");
    try {
      await upsertNightscout(userId, nsUrl, nsToken);
      await refresh();
      setMsg("Nightscout saved.");
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function onNightscoutPull() {
    if (!userId || !nsUrl) return;
    setBusy(true); setMsg("");
    try {
      const { inserted } = await pullNightscoutNow(userId, nsUrl, nsToken);
      setMsg(`Pulled ${inserted} entries from Nightscout.`);
    } catch (e) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect(provider) {
    if (!userId) return;
    setBusy(true); setMsg("");
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

  function onDexcomConnect() {
    if (!userId) return;
    startDexcomOAuth(userId); // redirects to /api/cgm/dexcom/start
  }

  return (
    <section aria-labelledby="cgm-head">
      <h4 id="cgm-head" style={{ marginBottom: 8 }}>Connect CGM</h4>

      {loading ? <div style={{ fontSize: 14, color: "#475569" }}>Checking connections…</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Dexcom */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Dexcom</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Connect via Dexcom OAuth (Sandbox/Prod per env)</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge ok={!!conns.dexcom} text={conns.dexcom ? "Connected" : "Not connected"} />
                {conns.dexcom ? (
                  <button disabled={busy} onClick={() => onDisconnect("dexcom")} style={{ padding: "8px 12px" }}>Disconnect</button>
                ) : (
                  <button disabled={busy || !userId} onClick={onDexcomConnect} style={{ background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>
                    Connect Dexcom
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nightscout */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Nightscout</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Enter your Nightscout URL and API secret</div>
              </div>
              <Badge ok={!!conns.nightscout} text={conns.nightscout ? "Connected" : "Not connected"} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <label>
                URL
                <input
                  placeholder="https://my-nightscout.herokuapp.com"
                  value={nsUrl}
                  onChange={(e) => setNsUrl(e.target.value)}
                />
              </label>
              <label>
                API Secret (optional)
                <input
                  placeholder="(if required)"
                  value={nsToken}
                  onChange={(e) => setNsToken(e.target.value)}
                />
              </label>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button disabled={busy || !userId || !nsUrl} onClick={onNightscoutSave} style={{ background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>
                Save Connection
              </button>
              <button disabled={busy || !userId || !nsUrl} onClick={onNightscoutPull} style={{ padding: "8px 12px" }}>
                Sync Now
              </button>
              {conns.nightscout && (
                <button disabled={busy} onClick={() => onDisconnect("nightscout")} style={{ padding: "8px 12px" }}>
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Apple / Android guidance */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>Apple Health / Android Health Connect</div>
            <ul style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
              <li>Open the Sentinel mobile app and go to <b>Settings → Health permissions</b>.</li>
              <li>Enable <b>Blood Glucose</b> read access.</li>
              <li>Tap <b>Sync Now</b> in the mobile app to upload data to your dashboard.</li>
            </ul>
          </div>

          {msg && <div style={{ fontSize: 13, color: "#334155" }}>{msg}</div>}
        </div>
      )}
    </section>
  );
}
