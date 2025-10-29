// src/components/NightscoutSignin.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function NightscoutSignin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // UI message

  useEffect(() => {
    // show who is logged in (optional)
    supabase.auth.getUser().then(({ data }) => {
      const em = data?.user?.email || "";
      setEmail(em);
    });
  }, []);

  async function testConnection() {
    setStatus("Testing Nightscout…");
    try {
      const res = await fetch("/api/nightscout/test");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Nightscout test failed");
      setStatus("Nightscout connected ✔");
    } catch (e) {
      setStatus("Nightscout test failed: " + (e?.message || String(e)));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2 className="h1" style={{ textAlign: "left" }}>Connect Nightscout</h2>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Add <code>NIGHTSCOUT_URL</code> and <code>NIGHTSCOUT_API_SECRET</code> in Vercel env vars
        (Project → Settings → Environment Variables). Then test below.
      </p>

      {email && (
        <div className="label" style={{ color: "#6b7280" }}>Signed in as {email}</div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={testConnection}>Test connection</button>
        <a className="btn" href="/settings">Settings</a>
      </div>

      {status && (
        <div className="label" style={{ marginTop: 10, color: status.includes("failed") ? "crimson" : "#047857" }}>
          {status}
        </div>
      )}
    </div>
  );
}
