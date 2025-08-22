// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React, { useEffect, useMemo, useState } from "react";
import ToastProvider, { useToast } from "../components/common/ToastProvider.jsx";
import { StatCard, Panel } from "../components/common/Cards.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";
import MigraineModal from "../components/modals/MigraineModal.jsx";
import GlucoseModal from "../components/modals/GlucoseModal.jsx";
import SleepModal from "../components/modals/SleepModal.jsx";

import { BRAND, getCurrentPalette, getChartLineColor, getPieSymptomColorMap } from "../lib/brand.js";
import { humanDateTime, daysBack, fmt, countByDate, avgByDate, sumSleepHoursByDate } from "../lib/helpers.js";

import supabase from "../services/supabaseClient";
import { listMigraines } from "../services/migraines.js";
import { listGlucose } from "../services/glucose.js";
import { listSleep } from "../services/sleep.js";
import { getDisclaimerConsent, upsertDisclaimerConsent } from "../services/consents.js";

export default function Dashboard(){
  const [user,setUser]=useState({ id: "00000000-0000-0000-0000-000000000000", email:"you@example.com" }); // replace with your auth provider
  const [episodes,setEpisodes]=useState([]);
  const [glucose,setGlucose]=useState([]);
  const [sleep,setSleep]=useState([]);
  const [consent,setConsent]=useState(null);

  const [openMigraine,setOpenMigraine]=useState(false);
  const [openGlucose,setOpenGlucose]=useState(false);
  const [openSleep,setOpenSleep]=useState(false);

  const [settingsTick,setSettingsTick]=useState(0);
  useEffect(()=>{ const onUpd=()=>setSettingsTick(t=>t+1); window.addEventListener("settings-updated", onUpd); return ()=>window.removeEventListener("settings-updated", onUpd); },[]);

  useEffect(()=>{
    (async()=>{
      if(!user?.id) return;
      const cons = await getDisclaimerConsent(user.id).catch(()=>null);
      setConsent(cons||null);
      const [m,g,s] = await Promise.all([ listMigraines(user.id), listGlucose(user.id), listSleep(user.id) ]);
      setEpisodes(m); setGlucose(g); setSleep(s);
    })();
  },[user?.id]);

  // Realtime (optional toggle via localStorage app.realtimeOn !== "false")
  useEffect(()=>{
    if(!user?.id) return;
    const realtimeOn = localStorage.getItem("app.realtimeOn")!=="false";
    if(!realtimeOn) return;
    const uid=user.id;
    const ch = supabase.channel("dashboard-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"migraine_episodes", filter:`user_id=eq.${uid}`}, p=>setEpisodes(prev=>merge(prev,p)))
      .on("postgres_changes",{event:"*",schema:"public",table:"glucose_readings", filter:`user_id=eq.${uid}`}, p=>setGlucose(prev=>merge(prev,p)))
      .on("postgres_changes",{event:"*",schema:"public",table:"sleep_data", filter:`user_id=eq.${uid}`}, p=>setSleep(prev=>merge(prev,p)))
      .subscribe();
    return ()=>{ try{ supabase.removeChannel(ch); }catch{} };
  },[user?.id]);

  // Metrics
  const last30 = useMemo(()=>{
    const window = daysBack(30);
    const map = countByDate(episodes, "date");
    const labels = window.map(fmt); const counts = labels.map(l=>map[l]||0);
    return { labels, counts };
  },[episodes]);

  const last14Glucose = useMemo(()=>{
    const window = daysBack(14);
    const avg = avgByDate(glucose, "device_time", "value_mgdl");
    const labels = window.map(fmt); const values = labels.map(l=>avg[l] ?? null);
    return { labels, values };
  },[glucose]);

  const last14Sleep = useMemo(()=>{
    const window = daysBack(14);
    const sum = sumSleepHoursByDate(sleep);
    const labels = window.map(fmt); const hours = labels.map(l=>(sum[l]||0));
    return { labels, hours };
  },[sleep]);

  const symptomCounts = useMemo(()=>{
    const counts={}; episodes.forEach(ep=>(ep.symptoms||[]).forEach(s=>counts[s]=(counts[s]||0)+1));
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
    return { labels: entries.map(e=>e[0]), data: entries.map(e=>e[1]) };
  },[episodes]);

  const basePalette = useMemo(()=>getCurrentPalette(),[settingsTick]);
  const colorMigraineLine = useMemo(()=>getChartLineColor("app.color.line.migraine", "#dc2626"),[settingsTick]);
  const colorGlucoseLine  = useMemo(()=>getChartLineColor("app.color.line.glucose", "#2563eb"),[settingsTick]);
  const colorSleepLine    = useMemo(()=>getChartLineColor("app.color.line.sleep", "#16a34a"),[settingsTick]);
  const pieSymptomColorsMap = getPieSymptomColorMap();
  const pieColors = useMemo(()=> symptomCounts.labels.map((label,i)=>{
    const c = pieSymptomColorsMap[label];
    return c && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : basePalette[i % basePalette.length];
  }),[symptomCounts.labels, basePalette, settingsTick]);

  async function acknowledgeDisclaimer(){
    if(!user?.id) return;
    await upsertDisclaimerConsent(user.id).catch(()=>{});
    setConsent({ user_id:user.id, type:"disclaimer", version:"v1", accepted_at:new Date().toISOString() });
  }

  const headerIdentity = user?.email || "";

  return (
    <ToastProvider>
      <div className="main">
        <header className="header safe-pad">
          <div style={{maxWidth:1120, margin:"0 auto", padding:"12px 16px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
            <div style={{width:24, height:24, background:"rgba(255,255,255,.2)", borderRadius:6}}/>
            <h1 style={{fontSize:16, fontWeight:600, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              Sentinel Health — Dashboard{headerIdentity?` — ${headerIdentity}`:""}
            </h1>
            <div style={{marginLeft:"auto", fontSize:12, padding:"2px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.12)"}}>
              Realtime: <strong>{localStorage.getItem("app.realtimeOn")!=="false" ? "ON" : "OFF"}</strong>
            </div>
          </div>
        </header>

        {!consent && (
          <div style={{maxWidth:680, margin:"16px auto 0", padding:"0 16px"}}>
            <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16}}>
              <h3 style={{marginTop:0, color:"var(--brand, #042d4d)"}}>Medical Disclaimer</h3>
              <p style={{color:"#374151", fontSize:14}}>Sentinel Health is a personal tracking tool and does not replace professional medical advice, diagnosis, or treatment.</p>
              <button onClick={acknowledgeDisclaimer} style={{marginTop:8, background:"var(--brand, #042d4d)", color:"#fff", padding:"8px 12px", borderRadius:8}}>I Understand</button>
            </div>
          </div>
        )}

        <main style={{maxWidth:1120, margin:"0 auto", padding:"16px"}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button onClick={()=>setOpenMigraine(true)} style={{background:"var(--brand, #042d4d)", color:"#fff", padding:"8px 12px", borderRadius:8}}>+ Migraine</button>
            <button onClick={()=>setOpenGlucose(true)} style={{background:"#7c3aed", color:"#fff", padding:"8px 12px", borderRadius:8}}>+ Glucose</button>
            <button onClick={()=>setOpenSleep(true)} style={{background:"#2563eb", color:"#fff", padding:"8px 12px", borderRadius:8}}>+ Sleep</button>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:12, marginTop:12}}>
            <StatCard title="Total Episodes" value={episodes.length||0} />
            <StatCard title="Avg Glucose (14d)" value={mean(last14Glucose.values)} suffix="mg/dL" />
            <StatCard title="Total Sleep (14d)" value={sum(last14Sleep.hours)} suffix="hrs" />
          </div>

          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginTop:12}}>
            <Panel title="Migraine Frequency (30d)" accentColor="#dc2626">
              <LineChart labels={last30.labels} data={last30.counts} color={colorMigraineLine} className="h-[280px]" />
            </Panel>
            <Panel title="Top Symptoms" accentColor="#7c3aed">
              <PieChart labels={symptomCounts.labels} data={symptomCounts.data} colors={pieColors} className="h-[280px]" />
            </Panel>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12}}>
            <Panel title="Avg Glucose (14d)" accentColor="#2563eb">
              <LineChart labels={last14Glucose.labels} data={last14Glucose.values} color={colorGlucoseLine} className="h-[280px]" />
            </Panel>
            <Panel title="Sleep Hours (14d)" accentColor="#16a34a">
              <LineChart labels={last14Sleep.labels} data={last14Sleep.hours} color={colorSleepLine} className="h-[280px]" />
            </Panel>
          </div>
        </main>

        {openMigraine && <MigraineModal onClose={()=>setOpenMigraine(false)} user={user} />}
        {openGlucose && <GlucoseModal onClose={()=>setOpenGlucose(false)} user={user} />}
        {openSleep && <SleepModal onClose={()=>setOpenSleep(false)} user={user} />}
      </div>
    </ToastProvider>
  );
}

function merge(list, payload, key="id"){
  const { eventType, new: rowNew, old: rowOld } = payload;
  if(eventType==="INSERT"){ if(!list.find(r=>r[key]===rowNew[key])) return [rowNew, ...list]; return list.map(r=>r[key]===rowNew[key]?rowNew:r); }
  if(eventType==="UPDATE"){ return list.map(r=>r[key]===rowNew[key]?rowNew:r); }
  if(eventType==="DELETE"){ return list.filter(r=>r[key]!==rowOld[key]); }
  return list;
}

function mean(vals){ const v=vals.filter(x=>x!=null); return v.length? +(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : "—"; }
function sum(vals){ return +(vals.reduce((a,b)=>a+b,0)).toFixed(1); }
