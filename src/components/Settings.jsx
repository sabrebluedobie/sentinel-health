import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState("info"); // 'info' | 'ok' | 'err'
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setMsg(""); setKind("info"); setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error("Please sign in to save settings.");

      const res = await fetch("/api/nightscout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ url, token, api_secret: apiSecret }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || res.statusText);

      setKind("ok");
      setMsg("Saved ✓");
    } catch (err) {
      setKind("err");
      setMsg(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  // ...render inputs bound to url, token, apiSecret, plus:
  // <button onClick={handleSave} disabled={busy}>Save</button>
}
import { Link } from "react-router-dom";
// …
<div style={{ marginTop: 8 }}>
  <Link to="/" style={{ fontSize: 14 }}>← Back to Dashboard</Link>
</div>
