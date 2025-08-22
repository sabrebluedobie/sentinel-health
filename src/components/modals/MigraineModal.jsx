// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React, { useState } from "react";
import Modal from "../common/Modal.jsx";
import { MultiSelectChips } from "../common/Cards.jsx";
import { insertMigraine } from "../../services/migraines.js";
import { localTzOffsetMinutes } from "../../lib/helpers.js";
import { DEFAULTS } from "../../services/settings.js";

export default function MigraineModal({ onClose, user }){
  const [dateTime,setDateTime]=useState(()=> new Date().toISOString().slice(0,16));
  const [pain,setPain]=useState(5);
  const [durationHours,setDurationHours]=useState("");
  const [symptoms,setSymptoms]=useState([]);
  const [triggers,setTriggers]=useState([]);
  const [symptomsExtra,setSymptomsExtra]=useState("");
  const [triggersExtra,setTriggersExtra]=useState("");
  const [medicationTaken,setMedicationTaken]=useState("");
  const [medicationEffective,setMedicationEffective]=useState("");
  const [notes,setNotes]=useState("");
  const [location,setLocation]=useState("");
  const [weather,setWeather]=useState("");
  const [baro,setBaro]=useState("");
  const [medicationNotes,setMedicationNotes]=useState("");
  const [saving,setSaving]=useState(false);

  async function save(){
    if(!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        date: new Date(dateTime).toISOString(),
        pain_level: Number(pain),
        duration_hours: durationHours===""? null : Number(durationHours),
        symptoms: Array.from(new Set([...symptoms, ...symptomsExtra.split(",").map(s=>s.trim()).filter(Boolean)])),
        triggers: Array.from(new Set([...triggers, ...triggersExtra.split(",").map(s=>s.trim()).filter(Boolean)])),
        medication_taken: medicationTaken || null,
        medication_effective: medicationEffective===""? null : Boolean(medicationEffective),
        notes: notes || null,
        location: location || null,
        weather_conditions: weather || null,
        barometric_pressure: baro===""? null : Number(baro),
        medication_notes: medicationNotes || null,
        timezone_offset_min: localTzOffsetMinutes(),
      };
      await insertMigraine(payload);
      onClose();
    } finally { setSaving(false); }
  }

  return (<Modal onClose={onClose}>
    <h3 style={{marginBottom:8}}>Log Migraine</h3>
    <label>Date & Time
      <input type="datetime-local" value={dateTime} onChange={e=>setDateTime(e.target.value)} />
    </label>
    <label>Pain (1–10)
      <input type="number" min={1} max={10} value={pain} onChange={e=>setPain(e.target.value)} />
    </label>
    <label>Duration (h)
      <input type="number" step="0.1" value={durationHours} onChange={e=>setDurationHours(e.target.value)} />
    </label>
    <MultiSelectChips label="Symptoms" options={DEFAULTS.SYMPTOMS} selected={symptoms} setSelected={setSymptoms} />
    <input placeholder="Add more, comma-separated" value={symptomsExtra} onChange={e=>setSymptomsExtra(e.target.value)} />
    <MultiSelectChips label="Triggers" options={DEFAULTS.TRIGGERS} selected={triggers} setSelected={setTriggers} />
    <input placeholder="Add more, comma-separated" value={triggersExtra} onChange={e=>setTriggersExtra(e.target.value)} />
    <label>Medication taken
      <input value={medicationTaken} onChange={e=>setMedicationTaken(e.target.value)} />
    </label>
    <label>Effective?
      <select value={String(medicationEffective)} onChange={e=>setMedicationEffective(e.target.value==="true"?true:e.target.value==="false"?false:"")}>
        <option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option>
      </select>
    </label>
    <label>Medication notes
      <input value={medicationNotes} onChange={e=>setMedicationNotes(e.target.value)} />
    </label>
    <label>Location
      <input value={location} onChange={e=>setLocation(e.target.value)} />
    </label>
    <label>Weather
      <input value={weather} onChange={e=>setWeather(e.target.value)} />
    </label>
    <label>Barometric pressure
      <input type="number" step="0.1" value={baro} onChange={e=>setBaro(e.target.value)} />
    </label>
    <label>Notes
      <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
    </label>
    <div style={{marginTop:12, display:"flex", gap:8}}>
      <button onClick={save} disabled={saving} style={{background:"#042d4d", color:"#fff", padding:"8px 12px", borderRadius:8}}>{saving?"Saving…":"Save"}</button>
      <button onClick={onClose} style={{padding:"8px 12px"}}>Cancel</button>
    </div>
  </Modal>);
}
