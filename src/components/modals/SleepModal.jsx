// src/components/modals/SleepModal.jsx
import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import "../forms/form.css";

export default function SleepModal({ open, onClose, onSave, initial }) {
  const [date, setDate]         = useState(() => initial?.date || new Date().toISOString().slice(0,10));
  const [sleepTime, setSleep]   = useState(() => initial?.sleep_time || "");
  const [wakeTime, setWake]     = useState(() => initial?.wake_time || "");
  const [total, setTotal]       = useState(() => initial?.total_sleep_hours ? String(initial.total_sleep_hours) : "");
  const [quality, setQuality]   = useState(() => initial?.sleep_quality ?? "");
  const [notes, setNotes]       = useState(() => initial?.notes || "");

  useEffect(() => {
    if (!sleepTime || !wakeTime) return;
    try {
      const [h1,m1] = sleepTime.split(":").map(Number);
      const [h2,m2] = wakeTime.split(":").map(Number);
      const t1 = h1*60+m1, t2 = h2*60+m2;
      const diffMin = t2 >= t1 ? (t2-t1) : (t2+24*60 - t1);
      const hrs = +(diffMin/60).toFixed(2);
      if (!Number.isNaN(hrs)) setTotal(String(hrs));
    } catch {}
  }, [sleepTime, wakeTime]);

  if (!open) return null;

  async function handleSave() {
    const payload = {
      date,
      sleep_time: sleepTime || null,
      wake_time:  wakeTime || null,
      total_sleep_hours: total==="" ? null : Number(total),
      sleep_quality: quality==="" ? null : Number(quality),
      notes: notes || null
    };
    await onSave?.(payload);
    onClose?.();
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Log Sleep</h3>

      <label className="label">Date
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </label>

      <label className="label">Sleep time
        <input className="input" type="time" value={sleepTime} onChange={e=>setSleep(e.target.value)} />
      </label>

      <label className="label">Wake time
        <input className="input" type="time" value={wakeTime} onChange={e=>setWake(e.target.value)} />
      </label>

      <label className="label">Total (hours)
        <input className="input" type="number" step="0.01" value={total} onChange={e=>setTotal(e.target.value)} />
      </label>

      <label className="label">Sleep quality (1–10)
        <input className="input" type="number" min="1" max="10" value={quality} onChange={e=>setQuality(e.target.value)} />
      </label>

      <label className="label">Notes
        <textarea className="input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
      </label>

      <div className="row">
        <button className="btn primary" onClick={handleSave}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
