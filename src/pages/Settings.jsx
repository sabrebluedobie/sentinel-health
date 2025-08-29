// src/pages/Settings.jsx (or wherever your Sync button lives)
import supabase from "@/lib/supabase";
import { useState } from "react";

export default function Settings() {
  const [syncMsg, setSyncMsg] = useState("");

  async function handleSyncNow() {
    setSyncMsg("Syncing…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sinceDays: 14 }),
      });

      const ct = res.headers.get("content-type") || "";
      let payload;
      if (ct.includes("application/json")) {
        payload = await res.json();
      } else {
        const txt = await res.text();
        payload = { ok: false, error: txt.slice(0, 400) };
      }

      if (!res.ok || payload?.ok === false) {
        setSyncMsg(`Sync failed: ${payload?.error || res.statusText}`);
        return;
      }

      setSyncMsg(`Synced ${payload?.inserted ?? 0} readings.`);
    } catch (e) {
      setSyncMsg(`Sync failed: ${e?.message || String(e)}`);
    }
  }

  return (
    <div className="card">
      {/* ... your Nightscout form ... */}
      <button className="btn" onClick={handleSyncNow}>Sync now</button>
      {!!syncMsg && <div className="muted" style={{marginTop:8}}>{syncMsg}</div>}
    </div>
  );
}
