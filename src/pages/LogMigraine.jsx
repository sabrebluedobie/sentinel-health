// src/pages/LogMigraine.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { Migraine } from "@/data/supabaseStore";

const DEFAULT_SYMPTOMS = [
  "aura", "nausea", "photophobia", "phonophobia", "vomiting", "neck pain", "dizziness"
];

export default function LogMigraine() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const [pain, setPain] = useState(5);
  const [symptomsCsv, setSymptomsCsv] = useState(""); // user can type CSV, we parse
  const [quick, setQuick] = useState(new Set()); // quick chips
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) nav("/signin?next=/log-migraine", { replace: true });
  }, [user, loading, nav]);

  function toggleQuick(s) {
    const next = new Set(quick);
    next.has(s) ? next.delete(s) : next.add(s);
    setQuick(next);
  }

  function gatherSymptoms() {
    const typed = (symptomsCsv || "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set([...typed, ...quick]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await Migraine.create({
        pain: Number(pain),
        symptoms: gatherSymptoms(), // array supported by store
        notes: notes || null,
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
          <h1 style={{ margin: 0 }}>Log Migraine</h1>
          <Link to="/" className="btn">Back</Link>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label>
            <div className="muted">Pain (0–10)</div>
            <input type="range" min="0" max="10" value={pain} onChange={(e)=>setPain(e.target.value)} className="input" />
            <div style={{ fontWeight: 700, marginTop: 4 }}>{pain}</div>
          </label>

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Quick symptoms</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEFAULT_SYMPTOMS.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleQuick(s)}
                  className="btn"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: quick.has(s) ? "var(--primary, #1a73e8)" : "#f4f4f4",
                    color: quick.has(s) ? "#fff" : "#000"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label>
            <div className="muted">Other symptoms (CSV)</div>
            <input
              type="text"
              placeholder="e.g. tingling, fatigue"
              value={symptomsCsv}
              onChange={(e)=>setSymptomsCsv(e.target.value)}
              className="input"
            />
          </label>

          <label>
            <div className="muted">Notes (optional)</div>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} className="input" rows={3} />
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
