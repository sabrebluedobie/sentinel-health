// src/pages/LogGlucose.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { Glucose } from "@/data/supabaseStore";

export default function LogGlucose() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [deviceTime, setDeviceTime] = useState(() => new Date().toISOString().slice(0,16)); // yyyy-MM-ddTHH:mm
  const [value, setValue] = useState("");
  const [trend, setTrend] = useState("flat");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) nav("/signin?next=/log-glucose", { replace: true });
  }, [user, loading, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!value) return setMsg("Please enter a glucose value.");
    setBusy(true);
    try {
      await Glucose.create({
        device_time: new Date(deviceTime).toISOString(),
        value_mgdl: Number(value),
        trend,
        source: "manual",
        note: note || null,
      });
      setMsg("Saved! Your dashboard will update in a moment.");
      // optional: go back after a short delay
      setTimeout(() => nav("/", { replace: true }), 600);
    } catch (e2) {
      setMsg(e2.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="container" style={{padding:24}}>Loading…</div>;

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ margin: 0 }}>Log Glucose</h1>
          <Link to="/" className="btn">Back</Link>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label>
            <div className="muted">Date & Time</div>
            <input type="datetime-local" value={deviceTime} onChange={(e)=>setDeviceTime(e.target.value)}
                   className="input" required />
          </label>

          <label>
            <div className="muted">Glucose (mg/dL)</div>
            <input type="number" min="30" max="600" step="1" value={value} onChange={(e)=>setValue(e.target.value)}
                   className="input" required />
          </label>

          <label>
            <div className="muted">Trend</div>
            <select value={trend} onChange={(e)=>setTrend(e.target.value)} className="input">
              <option value="rising">Rising</option>
              <option value="flat">Flat</option>
              <option value="falling">Falling</option>
            </select>
          </label>

          <label>
            <div className="muted">Note (optional)</div>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="input" rows={3} />
          </label>

          <button type="submit" disabled={busy} className="btn">
            {busy ? "Saving…" : "Save"}
          </button>
          {msg && <div className="muted">{msg}</div>}
        </form>
      </div>
    </div>
  );
}
