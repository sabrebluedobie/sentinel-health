// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import { insertSleep } from "../../services/sleep.js";
import { localTzOffsetMinutes } from "../../lib/helpers.js";

export default function SleepModal({ onClose, user }){
  const nowIso = new Date().toISOString().slice(0,16);
  const [startTime,setStartTime]=useState(nowIso);
  const [sleepDate,setSleepDate]=useState(()=> new Date().toISOString().slice(0,10));
  const [bedtime,setBedtime]=useState("");
  const [sleepTime,setSleepTime]=useState("");
  const [wakeTime,setWakeTime]=useState("");
  const [totalHours,setTotalHours]=useState("");
  const [sleepQuality,setSleepQuality]=useState("");
  const [timesWoken,setTimesWoken]=useState("");
  const [sleepEfficiency,setSleepEfficiency]=useState("");
  const [notes,setNotes]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!sleepTime || !wakeTime) return;
    try {
      const [h1,m1] = sleepTime.split(":").map(Number);
      const [h2,m2] = wakeTime.split(":").map(Number);
      const t1=h1*60+m1, t2=h2*60+m2;
      const diffMin = t2 >= t1 ? (t2 - t1) : (t2 + 24*60 - t1);
      const hrs = +(diffMin / 60).toFixed(2);
      if (!Number.isNaN(hrs)) setTotalHours(String(hrs));
    } catch {}
  },[sleepTime,wakeTime]);

  async function save(){
    if(!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        date: sleepDate,
        bedtime: bedtime || null,
        sleep_time: sleepTime || null,
        wake_time: wakeTime || null,
        total_sleep_hours: Number(totalHours),
        sleep_quality: sleepQuality==="" ? null : Number(sleepQuality),
        times_woken: timesWoken==="" ? null : Number(timesWoken),
        sleep_efficiency: sleepEfficiency==="" ? null : Number(sleepEfficiency),
        notes: notes || null,
        created_at: new Date().toISOString(),
        timezone_offset_min: localTzOffsetMinutes(),
        start_time: new Date(startTime).toISOString(),
      };
      await insertSleep(payload);
      onClose();
    } finally { setSaving(false); }
  }

  return (<Modal onClose={onClose}>
    <h3 style={{marginBottom:8}}>Log Sleep</h3>
    <label>Start time
      <input type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} />
    </label>
    <label>Date
      <input type="date" value={sleepDate} onChange={e=>setSleepDate(e.target.value)} />
    </label>
    <label>Bedtime
      <input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} />
    </label>
    <label>Sleep time
      <input type="time" value={sleepTime} onChange={e=>setSleepTime(e.target.value)} />
    </label>
    <label>Wake time
      <input type="time" value={wakeTime} onChange={e=>setWakeTime(e.target.value)} />
    </label>
    <label>Total sleep (hours) *
      <input type="number" step="0.1" value={totalHours} onChange={e=>setTotalHours(e.target.value)} />
    </label>
    <label>Sleep quality (1–10)
      <input type="number" min={1} max={10} value={sleepQuality} onChange={e=>setSleepQuality(e.target.value)} />
    </label>
    <label>Times woken
      <input type="number" value={timesWoken} onChange={e=>setTimesWoken(e.target.value)} />
    </label>
    <label>Sleep efficiency (%)
      <input type="number" step="0.1" value={sleepEfficiency} onChange={e=>setSleepEfficiency(e.target.value)} />
    </label>
    <label>Notes
      <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
    </label>
    <div style={{marginTop:12, display:"flex", gap:8}}>
      <button onClick={save} disabled={saving} style={{background:"#2563eb", color:"#fff", padding:"8px 12px", borderRadius:8}}>{saving?"Saving…":"Save"}</button>
      <button onClick={onClose} style={{padding:"8px 12px"}}>Cancel</button>
    </div>
  </Modal>);
}
