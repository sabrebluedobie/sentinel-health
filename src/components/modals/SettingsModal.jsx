import React, { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import ConnectCGM from "../settings/ConnectCGM.jsx";
import supabase from "../../services/supabaseClient.js";
import { syncNightscoutNow, checkNightscoutConnection } from "../../services/syncNow.js";
import { listGlucose } from "../../services/glucose.js";

function getLS(key, fallback){ const v=localStorage.getItem(key); return v==null?fallback:v; }

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState("prefs");
  const [bgMode, setBgMode] = useState(getLS("app.theme.bg","blue"));
  const [fontScale, setFontScale] = useState(parseFloat(getLS("app.theme.fontScale","1")));
  const [contrast, setContrast] = useState(getLS("app.theme.contrast","normal"));
  const [colorMigraineLine, setColorMigraineLine] = useState(getLS("app.color.line.migraine","#dc2626"));
  const [colorGlucoseLine, setColorGlucoseLine] = useState(getLS("app.color.line.glucose","#2563eb"));
  const [colorSleepLine, setColorSleepLine] = useState(getLS("app.color.line.sleep","#16a34a"));
  const [symptomColorText, setSymptomColorText] = useState(() => { try{ return Object.entries(JSON.parse(getLS("app.pieSymptomColors","{}"))).map(([k,v])=>`${k}=${v}`).join("\n"); } catch{return ""} });
  const [realtimeOn, setRealtimeOn] = useState(getLS("app.realtimeOn","true")!=="false");

  function savePrefs(){
    localStorage.setItem("app.theme.bg", bgMode);
    localStorage.setItem("app.theme.fontScale", String(fontScale));
    localStorage.setItem("app.theme.contrast", contrast);
    localStorage.setItem("app.color.line.migraine", colorMigraineLine);
    localStorage.setItem("app.color.line.glucose", colorGlucoseLine);
    localStorage.setItem("app.color.line.sleep", colorSleepLine);
    localStorage.setItem("app.realtimeOn", realtimeOn ? "true":"false");
    const map={}; symptomColorText.split(/\n+/).map(l=>l.trim()).filter(Boolean).forEach(line=>{ const [k,v]=line.split("="); if(k&&v) map[k.trim()]=v.trim(); });
    localStorage.setItem("app.pieSymptomColors", JSON.stringify(map));
    window.dispatchEvent(new Event("settings-updated"));
  }
  const handleClose = ()=>{ savePrefs(); onClose?.(); };

  const [userId, setUserId] = useState(null);
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUserId(data?.user?.id||null)); }, []);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function reloadGlucose(uid){ try{ const g=await listGlucose(uid); window.dispatchEvent(new CustomEvent("glucose-reloaded",{ detail:g })); }catch{} }

  async function onCheck(){
    setBusy(true); setMsg("");
    try{ const res = await checkNightscoutConnection(); setMsg(JSON.stringify(res,null,2)); }
    catch(e){ setMsg(`Check failed: ${e?.message || e}`); }
    finally{ setBusy(false); }
  }
  async function onSync(){
    if (!userId){ setMsg("Not signed in"); return; }
    setBusy(true); setMsg("");
    try{
      const res = await syncNightscoutNow();
      setMsg(res?.error ? `Sync failed: ${res.error}` : res?.reason==="no-connection" ? "No Nightscout connection set yet." : `Synced ${res.inserted ?? 0} rows.`);
      await reloadGlucose(userId);
    }catch(e){ setMsg(`Sync failed: ${e?.message || e}`); }
    finally{ setBusy(false); }
  }

  const TabBtn = ({id,label})=>(
    <button onClick={()=>setTab(id)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${tab===id?"#0ea5e9":"#e5e7eb"}`, background:tab===id?"rgba(14,165,233,.08)":"#fff", fontWeight:tab===id?700:600 }}>{label}</button>
  );

  return (
    <Modal onClose={handleClose}>
      <h3 style={{ marginBottom:12, fontWeight:700 }}>Settings</h3>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <TabBtn id="prefs" label="Preferences" />
        <TabBtn id="cgm" label="CGM" />
        <TabBtn id="about" label="About" />
      </div>

      {tab==="prefs" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <label>Background
              <select value={bgMode} onChange={(e)=>setBgMode(e.target.value)} style={{ display:"block", width:"100%" }}>
                <option value="blue">Blue</option><option value="light">Light</option>
              </select>
            </label>
            <label>Contrast
              <select value={contrast} onChange={(e)=>setContrast(e.target.value)} style={{ display:"block", width:"100%" }}>
                <option value="normal">Normal</option><option value="high">High</option>
              </select>
            </label>
            <label style={{ gridColumn:"1 / -1" }}>Font size
              <input type="range" min="0.9" max="1.2" step="0.05" value={fontScale} onChange={(e)=>setFontScale(parseFloat(e.target.value))} style={{ width:"100%" }}/>
              <div style={{ fontSize:12, color:"#475569" }}>{Math.round(fontScale*100)}%</div>
            </label>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:12 }}>
            <label> Migraine line <input type="color" value={colorMigraineLine} onChange={(e)=>setColorMigraineLine(e.target.value)} /></label>
            <label> Blood sugar line <input type="color" value={colorGlucoseLine} onChange={(e)=>setColorGlucoseLine(e.target.value)} /></label>
            <label> Sleep line <input type="color" value={colorSleepLine} onChange={(e)=>setColorSleepLine(e.target.value)} /></label>
          </div>

          <label style={{ display:"block", marginTop:12 }}>
            Pie symptom colors (NAME=#hex per line)
            <textarea rows={4} value={symptomColorText} onChange={(e)=>setSymptomColorText(e.target.value)} style={{ width:"100%" }} placeholder="Nausea=#ff5a5f&#10;Photophobia=#3b82f6" />
          </label>

          <label style={{ display:"block", marginTop:10 }}>
            <input type="checkbox" checked={realtimeOn} onChange={(e)=>setRealtimeOn(e.target.checked)} /> Realtime updates
          </label>
        </div>
      )}

      {tab==="cgm" && (
        <div>
          <ConnectCGM userId={userId} />
          <hr style={{ margin:"16px 0", border:0, borderTop:"1px solid #e5e7eb" }} />
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={onCheck} disabled={busy} style={{ padding:"10px 14px", borderRadius:10, fontWeight:700, background:"#0ea5e9", color:"#fff", border:"1px solid #0284c7" }}>{busy ? "Checking…" : "Check Connection"}</button>
            <button onClick={onSync}  disabled={busy} style={{ padding:"10px 14px", borderRadius:10, fontWeight:700, background:"#2563eb", color:"#fff", border:"1px solid #1d4ed8" }}>{busy ? "Syncing…" : "Sync Now"}</button>
          </div>
          {msg && (<pre style={{ marginTop:10, padding:10, background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:8, maxHeight:220, overflow:"auto", fontSize:12, color:"#0f172a" }}>{msg}</pre>)}
          <p style={{ marginTop:8, fontSize:12, color:"#64748b" }}>“Check Connection” verifies vault + Nightscout status. “Sync Now” pulls readings into Sentinel.</p>
        </div>
      )}

      {tab==="about" && (<div><p style={{ color:"#334155", lineHeight:1.5 }}>Data is siloed by user via Supabase RLS. CGM sync uses your Nightscout URL + token stored per-user (encrypted).</p></div>)}

      <div style={{ marginTop:14, display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={handleClose} style={{ padding:"8px 12px" }}>Close</button>
      </div>
    </Modal>
  );
}