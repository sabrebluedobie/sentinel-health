// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import { insertGlucose } from "../../services/glucose.js";
import { localTzOffsetMinutes } from "../../lib/helpers.js";

export default function GlucoseModal({ onClose, user }){
  const [value,setValue]=useState("");
  const [when,setWhen]=useState(()=> new Date().toISOString().slice(0,16));
  const [readingType,setReadingType]=useState("random");
  const [note,setNote]=useState("");
  const [source,setSource]=useState("");
  const [trend,setTrend]=useState("");
  const [saving,setSaving]=useState(false);

  async function save(){
    if(!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        device_time: new Date(when).toISOString(),
        reading_type: readingType || null,
        note: note || null,
        created_at: new Date().toISOString(),
        source: source || null,
        value_mgdl: value==="" ? null : parseFloat(String(value).trim()),
        trend: trend || null,
        timezone_offset_min: localTzOffsetMinutes(),
      };
      await insertGlucose(payload);
      onClose();
    } finally { setSaving(false); }
  }

  return (<Modal onClose={onClose}>
    <h3 style={{marginBottom:8}}>Log Glucose</h3>
    <label>Value (mg/dL)
      <input type="number" inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} />
    </label>
    <label>Time
      <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
    </label>
    <label>Reading type
      <select value={readingType} onChange={e=>setReadingType(e.target.value)}>
        <option value="random">Random</option>
        <option value="fasting">Fasting</option>
        <option value="post_meal">Post meal</option>
        <option value="bedtime">Bedtime</option>
      </select>
    </label>
    <label>Source
      <input value={source} onChange={e=>setSource(e.target.value)} placeholder="Dexcom, Libre, Manual..." />
    </label>
    <label>Trend
      <input value={trend} onChange={e=>setTrend(e.target.value)} placeholder="rising / falling / steady" />
    </label>
    <label>Note
      <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)} />
    </label>
    <div style={{marginTop:12, display:"flex", gap:8}}>
      <button onClick={save} disabled={saving} style={{background:"#7c3aed", color:"#fff", padding:"8px 12px", borderRadius:8}}>{saving?"Saving…":"Save"}</button>
      <button onClick={onClose} style={{padding:"8px 12px"}}>Cancel</button>
    </div>
  </Modal>);
}
