// src/pages/LogSleep.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { SleepData } from "@/data/supabaseStore";

export default function LogSleep() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 3600 * 1000);

  const [start, setStart] = useState(sixHoursAgo.toISOString().slice(0,16)); // yyyy-MM-ddTHH:mm
  const [end, setEnd] = useState(now.toISOString().slice(0,16));
  const [eff, setEff] = useState(""); // %
  const [light, setLight] = useState("");
  const [deep, setDeep] = useState("");
  const [rem, setRem] = useState("");
  const [awake, setAwake] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) nav("/signin?next=/log-sleep", { replace: true });
  }, [user, loading, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();
    if (new Date(endIso) <= new Date(startIso)) return setMsg("End must be after Start.");
    setBusy(true);
    try {
      const stages = {};
      if (light) stages.light = Number(light);
      if (deep) stages.deep = Number(deep);
      if (rem) stages.rem = Number(rem);
      if (awake) stages.awake = Number(awake);

      await SleepData.create({
        start_time: startIso,
        end_time: endIso,
        efficiency: eff ? Number(eff) : null,
        stages: Object.keys(stages).length ? stages : null,
        note: note || null,
        source: "manual",
      });

      setMsg("Saved! Your dashboard will update shortly.");
      setTimeout(() => nav("/", { replace: true }), 600);
    } catch (err) {
      setMsg(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="container" style={{padding:24}}>Loading…</div>;

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ margin: 0 }}>Log Sleep</h1>
          <Link to="/" className="btn">Back</Link>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label>
            <div className="muted">Start</div>
            <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} className="input" required />
          </label>

          <label>
            <div className="muted">End</div>
            <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} className="input" required />
          </label>

          <label>
            <div className="muted">Efficiency % (optional)</div>
            <input type="number" min="0" max="100" step="1" value={eff} onChange={(e)=>setEff(e.target.value)} className="input" />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
            <label>
              <div className="muted">Light (min)</div>
              <input type="number" min="0" step="1" value={light} onChange={(e)=>setLight(e.target.value)} className="input" />
            </label>
            <label>
              <div className="muted">Deep (min)</div>
              <input type="number" min="0" step="1" value={deep} onChange={(e)=>setDeep(e.target.value)} className="input" />
            </label>
            <label>
              <div className="muted">REM (min)</div>
              <input type="number" min="0" step="1" value={rem} onChange={(e)=>setRem(e.target.value)} className="input" />
            </label>
            <label>
              <div className="muted">Awake (min)</div>
              <input type="number" min="0" step="1" value={awake} onChange={(e)=>setAwake(e.target.value)} className="input" />
            </label>
          </div>

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
